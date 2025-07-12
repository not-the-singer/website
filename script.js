let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

// Spotify API configuration
const SPOTIFY_CLIENT_ID = '35be0285e67a4fafbe3b31b7b0048dc0';
const SPOTIFY_ARTIST_ID = '50imQLsQADUBJTKncqsb3I';
let albums = [];
let spotifyToken = '';

// Get Spotify access token
async function getSpotifyToken() {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${SPOTIFY_CLIENT_ID}&client_secret=YOUR_CLIENT_SECRET`
    });
    
    // Since we don't have client secret, we'll use the public client credentials flow
    // For now, let's use a different approach - direct API calls that work without secret
    return null;
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return null;
  }
}

// Fetch albums from Spotify (using public endpoints)
async function fetchSpotifyAlbums() {
  try {
    // For production, you'd need the client credentials flow
    // For now, let's structure the data to match what Spotify returns
    // and simulate real album data
    
    // This would be the real API call:
    // const response = await fetch(`https://api.spotify.com/v1/artists/${SPOTIFY_ARTIST_ID}/albums?include_groups=album,single&limit=50`, {
    //   headers: { 'Authorization': `Bearer ${spotifyToken}` }
    // });
    
    // Simulated Spotify-like data structure for now
    albums = [
      {
        id: 'spotify_album_1',
        name: 'Perpetual Motion',
        album_type: 'album',
        release_date: '2024-12-23',
        release_date_precision: 'day',
        total_tracks: 4,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=640&fit=crop',
            height: 640,
            width: 640
          }
        ],
        external_urls: {
          spotify: 'https://open.spotify.com/album/example1'
        },
        // Additional streaming links (you'd populate these manually or from another service)
        streaming_links: {
          apple: 'https://music.apple.com/album/example1',
          bandcamp: 'https://notthesinger.bandcamp.com/album/perpetual-motion',
          soundcloud: 'https://soundcloud.com/not-the-singer/sets/perpetual-motion',
          youtube: 'https://youtube.com/playlist?list=example1',
          deezer: 'https://deezer.com/album/example1',
          tidal: 'https://tidal.com/album/example1',
          amazonMusic: 'https://music.amazon.com/album/example1'
        }
      },
      {
        id: 'spotify_single_1',
        name: 'Digital Landscapes',
        album_type: 'single',
        release_date: '2024-11-15',
        release_date_precision: 'day',
        total_tracks: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=640&fit=crop',
            height: 640,
            width: 640
          }
        ],
        external_urls: {
          spotify: 'https://open.spotify.com/track/example2'
        },
        streaming_links: {
          apple: 'https://music.apple.com/song/example2',
          bandcamp: 'https://notthesinger.bandcamp.com/track/digital-landscapes',
          soundcloud: 'https://soundcloud.com/not-the-singer/digital-landscapes',
          youtube: 'https://youtube.com/watch?v=example2',
          deezer: 'https://deezer.com/track/example2',
          tidal: 'https://tidal.com/track/example2',
          amazonMusic: 'https://music.amazon.com/track/example2'
        }
      },
      {
        id: 'spotify_album_2',
        name: 'Underground Frequencies',
        album_type: 'album',
        release_date: '2024-10-03',
        release_date_precision: 'day',
        total_tracks: 3,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571974599782-87624638275c?w=640&h=640&fit=crop',
            height: 640,
            width: 640
          }
        ],
        external_urls: {
          spotify: 'https://open.spotify.com/album/example3'
        },
        streaming_links: {
          apple: 'https://music.apple.com/album/example3',
          bandcamp: 'https://notthesinger.bandcamp.com/album/underground-frequencies',
          soundcloud: 'https://soundcloud.com/not-the-singer/sets/underground-frequencies',
          youtube: 'https://youtube.com/playlist?list=example3',
          deezer: 'https://deezer.com/album/example3',
          tidal: 'https://tidal.com/album/example3',
          amazonMusic: 'https://music.amazon.com/album/example3'
        }
      },
      {
        id: 'spotify_single_2',
        name: 'Neon Nights',
        album_type: 'single',
        release_date: '2024-09-12',
        release_date_precision: 'day',
        total_tracks: 1,
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=640&h=640&fit=crop',
            height: 640,
            width: 640
          }
        ],
        external_urls: {
          spotify: 'https://open.spotify.com/track/example4'
        },
        streaming_links: {
          apple: 'https://music.apple.com/song/example4',
          bandcamp: 'https://notthesinger.bandcamp.com/track/neon-nights',
          soundcloud: 'https://soundcloud.com/not-the-singer/neon-nights',
          youtube: 'https://youtube.com/watch?v=example4',
          deezer: 'https://deezer.com/track/example4',
          tidal: 'https://tidal.com/track/example4',
          amazonMusic: 'https://music.amazon.com/track/example4'
        }
      }
    ];
    
    // Sort by release date (newest first)
    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    
  } catch (error) {
    console.error('Error fetching Spotify albums:', error);
  }
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
  
  albums.forEach((album, index) => {
    const albumCard = document.createElement('div');
    albumCard.className = 'album-card';
    albumCard.onclick = () => showAlbumDetail(album);
    
    // Get the best quality image
    const artwork = album.images && album.images.length > 0 ? album.images[0].url : '';
    
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
  const artwork = album.images && album.images.length > 0 ? album.images[0].url : '';
  
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
    if (platform.url) {
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
