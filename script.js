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
    
    // Transform Spotify data to our format and add manual streaming links
    albums = spotifyAlbums.map(album => ({
      id: album.id,
      name: album.name,
      album_type: album.album_type,
      release_date: album.release_date,
      release_date_precision: album.release_date_precision,
      total_tracks: album.total_tracks,
      images: album.images,
      external_urls: album.external_urls,
      // Add your manual streaming links here
      streaming_links: getStreamingLinksForAlbum(album.name, album.album_type)
    }));
    
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

// Manual streaming links mapping (update these with your real links)
function getStreamingLinksForAlbum(albumName, albumType) {
  // You can customize this function to return different links for different albums
  const baseLinks = {
    apple: 'https://music.apple.com/artist/not-the-singer/1597993257',
    bandcamp: 'https://notthesinger.bandcamp.com/',
    soundcloud: 'https://soundcloud.com/not-the-singer',
    youtube: 'https://www.youtube.com/channel/UCvb-OX6v2zdByJqrXveEGww',
    deezer: 'https://deezer.com/artist/not-the-singer',
    tidal: 'https://tidal.com/artist/not-the-singer',
    amazonMusic: 'https://music.amazon.com/artist/not-the-singer'
  };
  
  // You can add specific links for specific albums here
  if (albumName.toLowerCase().includes('perpetual motion')) {
    return {
      ...baseLinks,
      bandcamp: 'https://notthesinger.bandcamp.com/album/perpetual-motion',
      soundcloud: 'https://soundcloud.com/not-the-singer/sets/perpetual-motion'
    };
  }
  
  // Add more specific album mappings as needed
  
  return baseLinks;
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
  
  // Create streaming links
  streamingLinks.innerHTML = '';
  
  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify', url: album.external_urls?.spotify },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple', url: album.streaming_links?.apple },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp', url: album.streaming_links?.bandcamp },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud', url: album.streaming_links?.soundcloud },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', url: album.streaming_links?.youtube },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer', url: album.streaming_links?.deezer },
    { key: 'tidal', name: 'Tidal', icon: 'fas fa-music', url: album.streaming_links?.tidal },
    { key: 'amazonMusic', name: 'Amazon Music', icon: 'fab fa-amazon', url: album.streaming_links?.amazonMusic }
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
