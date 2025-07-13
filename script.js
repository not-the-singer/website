let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

// API configuration
const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];

// Fetch real albums from your Spotify API
async function fetchSpotifyAlbums() {
  try {
    console.log('Fetching albums from Spotify API...');
    
    const response = await fetch(`${API_BASE_URL}/api/spotify`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const spotifyAlbums = await response.json();
    console.log('Raw Spotify data:', spotifyAlbums);
    
    // Transform Spotify data to our format with automated streaming links
    albums = await Promise.all(spotifyAlbums.map(async (album) => ({
      id: album.id,
      name: album.name,
      album_type: album.album_type,
      release_date: album.release_date,
      release_date_precision: album.release_date_precision,
      total_tracks: album.total_tracks,
      images: album.images,
      external_urls: album.external_urls,
      // Get automated streaming links
      streaming_links: await searchAllPlatforms(album.name, 'Not the Singer')
    })));
    
    // Sort by release date (newest first)
    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    
    console.log('Processed albums:', albums);
    
  } catch (error) {
    console.error('Error fetching Spotify albums:', error);
    
    // Fallback to sample data if API fails
    albums = [
      {
        id: 'fallback_1',
        name: 'API Connection Issue',
        album_type: 'single',
        release_date: '2024-01-01',
        total_tracks: 1,
        images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=640&fit=crop' }],
        external_urls: { spotify: '#' },
        streaming_links: {}
      }
    ];
  }
}

// Automated streaming platform search
async function searchAllPlatforms(albumName, artistName) {
  const platforms = {
    spotify: await searchSpotify(albumName, artistName),
    apple: await searchAppleMusic(albumName, artistName),
    beatport: await searchBeatport(albumName, artistName),
    bandcamp: await searchBandcamp(albumName, artistName),
    soundcloud: await searchSoundCloud(albumName, artistName),
    youtube: await searchYouTube(albumName, artistName),
    deezer: await searchDeezer(albumName, artistName),
    tidal: await searchTidal(albumName, artistName),
    amazonMusic: await searchAmazonMusic(albumName, artistName),
    traxsource: await searchTraxsource(albumName, artistName),
    junodownload: await searchJunoDownload(albumName, artistName)
  };
  
  return platforms;
}

// Individual search functions for each platform
async function searchSpotify(album, artist) {
  return `https://open.spotify.com/search/${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchAppleMusic(album, artist) {
  return `https://music.apple.com/search?term=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchBeatport(album, artist) {
  return `https://www.beatport.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchBandcamp(album, artist) {
  return `https://bandcamp.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchSoundCloud(album, artist) {
  return `https://soundcloud.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchYouTube(album, artist) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchDeezer(album, artist) {
  return `https://www.deezer.com/search/${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchTidal(album, artist) {
  return `https://tidal.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchAmazonMusic(album, artist) {
  return `https://music.amazon.com/search/${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchTraxsource(album, artist) {
  return `https://www.traxsource.com/search?term=${encodeURIComponent(artist + ' ' + album)}`;
}

async function searchJunoDownload(album, artist) {
  return `https://www.junodownload.com/search/?q%5Ball%5D=${encodeURIComponent(artist + ' ' + album)}`;
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

// Helper function to get album type display
function getAlbumTypeDisplay(albumType, trackCount) {
  if (albumType === 'single') {
    return trackCount > 1 ? 'EP' : 'Single';
  }
  return 'Album';
}

function toggleMenu() {
  const dropdown = document.getElementById('menuDropdown');
  const overlay = document.getElementById('menuOverlay');
  const trigger = document.getElementById('menuTrigger');
  
  isMenuOpen = !isMenuOpen;
  
  if (isMenuOpen) {
    dropdown.classList.add('open');
    overlay.classList.add('active');
    trigger.innerHTML = 'Close <i class="fas fa-times"></i>';
  } else {
    dropdown.classList.remove('open');
    overlay.classList.remove('active');
    trigger.innerHTML = 'Menu <i class="fas fa-bars"></i>';
  }
}

function closeMenu() {
  if (isMenuOpen) {
    toggleMenu();
  }
}

function goHome() {
  if (isOnAlbumDetail) {
    closeAlbumDetail();
    return;
  }
  
  if (isOnMusicPage) {
    document.getElementById('musicPage').classList.remove('active');
    document.getElementById('homePage').classList.remove('blur');
    isOnMusicPage = false;
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  closeMenu();
}

function showMusic() {
  if (isOnAlbumDetail) return;
  
  document.getElementById('homePage').classList.add('blur');
  
  setTimeout(() => {
    loadAlbums();
    document.getElementById('musicPage').classList.add('active');
    isOnMusicPage = true;
  }, 300);
  
  closeMenu();
}

function loadAlbums() {
  const albumGrid = document.getElementById('albumGrid');
  albumGrid.innerHTML = '';
  
  if (albums.length === 0) {
    albumGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading albums...</div>';
    return;
  }
  
  albums.forEach((album, index) => {
    const albumCard = document.createElement('div');
    albumCard.className = 'album-card';
    albumCard.onclick = () => showAlbumDetail(album);
    
    // Get the best quality image (Spotify provides multiple sizes)
    const artwork = album.images && album.images.length > 0 ? album.images[0].url : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop';
    
    // Format album info
    const albumType = getAlbumTypeDisplay(album.album_type, album.total_tracks);
    const trackInfo = album.total_tracks > 1 ? `${album.total_tracks} tracks` : '1 track';
    const formattedDate = formatDate(album.release_date);
    
    albumCard.innerHTML = `
      <div class="album-artwork">
        <img src="${artwork}" alt="${album.name}" loading="lazy">
      </div>
      <div class="album-info">
        <div class="album-title">${album.name}</div>
        <div class="album-type">${albumType} • ${trackInfo}</div>
        <div class="album-date">${formattedDate}</div>
      </div>
    `;
    
    albumGrid.appendChild(albumCard);
  });
}

function showAlbumDetail(album) {
  const detailPage = document.getElementById('albumDetail');
  const detailArtwork = document.getElementById('detailArtwork');
  const detailTitle = document.getElementById('detailTitle');
  const detailMeta = document.getElementById('detailMeta');
  const streamingLinks = document.getElementById('streamingLinks');
  
  // Get the best quality image
  const artwork = album.images && album.images.length > 0 ? album.images[0].url : 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop';
  
  // Set background to blurred album artwork
  detailPage.style.backgroundImage = `url(${artwork})`;
  
  // Set album info
  detailArtwork.src = artwork;
  detailTitle.textContent = album.name;
  
  // Format metadata
  const albumType = getAlbumTypeDisplay(album.album_type, album.total_tracks);
  const trackInfo = album.total_tracks > 1 ? `${album.total_tracks} tracks` : '1 track';
  const formattedDate = formatDate(album.release_date);
  detailMeta.textContent = `${albumType} • ${trackInfo} • ${formattedDate}`;
  
  // Create streaming links with all platforms including Beatport
  streamingLinks.innerHTML = '';
  
  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify', url: album.external_urls?.spotify },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple', url: album.streaming_links?.apple },
    { key: 'beatport', name: 'Beatport', icon: 'si si-beatport', url: album.streaming_links?.beatport },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp', url: album.streaming_links?.bandcamp },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud', url: album.streaming_links?.soundcloud },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', url: album.streaming_links?.youtube },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer', url: album.streaming_links?.deezer },
    { key: 'tidal', name: 'Tidal', icon: 'si si-tidal', url: album.streaming_links?.tidal },
    { key: 'amazonMusic', name: 'Amazon Music', icon: 'fab fa-amazon', url: album.streaming_links?.amazonMusic },
    { key: 'traxsource', name: 'Traxsource', icon: 'fas fa-record-vinyl', url: album.streaming_links?.traxsource },
    { key: 'junodownload', name: 'Juno Download', icon: 'fas fa-download', url: album.streaming_links?.junodownload }
  ];
  
  streamingPlatforms.forEach(platform => {
    if (platform.url && platform.url !== '#') {
      const link = document.createElement('a');
      link.href = platform.url;
      link.target = '_blank';
      link.className = 'streaming-link';
      link.innerHTML = `
        <i class="${platform.icon}"></i>
        <span>${platform.name}</span>
      `;
      streamingLinks.appendChild(link);
    }
  });
  
  // Show detail page
  document.getElementById('musicPage').classList.remove('active');
  detailPage.classList.add('active');
  isOnAlbumDetail = true;
}

function closeAlbumDetail() {
  document.getElementById('albumDetail').classList.remove('active');
  
  setTimeout(() => {
    document.getElementById('musicPage').classList.add('active');
    isOnAlbumDetail = false;
  }, 300);
}

// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Spotify data
  fetchSpotifyAlbums();
  
  // Close menu when clicking on menu items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      if (this.textContent.trim().includes('Music')) {
        showMusic();
      } else {
        console.log('Navigate to:', this.textContent.trim());
        closeMenu();
      }
    });
  });

  // Prevent menu from closing when clicking inside dropdown
  document.getElementById('menuDropdown').addEventListener('click', function(event) {
    event.stopPropagation();
  });
});

// Handle back button functionality
window.addEventListener('popstate', function(event) {
  if (isOnAlbumDetail) {
    closeAlbumDetail();
  } else if (isOnMusicPage) {
    goHome();
  }
});

// Close album detail with escape key
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (isOnAlbumDetail) {
      closeAlbumDetail();
    } else if (isOnMusicPage) {
      goHome();
    } else if (isMenuOpen) {
      closeMenu();
    }
  }
});
