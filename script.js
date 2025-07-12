let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

// SoundCloud configuration
const SOUNDCLOUD_USER_ID = 'not-the-singer'; // Replace with your actual username
let albums = [];

// Function to fetch data from SoundCloud
async function fetchSoundCloudData() {
  try {
    // For now, using sample data structure that matches SoundCloud API
    // You'll need to register for SoundCloud API and get a client_id
    albums = [
      {
        id: 1,
        title: "Perpetual Motion",
        type: "EP",
        date: "2024-12-23T00:00:00Z",
        artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&crop=faces",
        duration: 1440000, // in milliseconds
        track_count: 4,
        links: {
          spotify: "https://open.spotify.com/album/example1",
          apple: "https://music.apple.com/album/example1",
          bandcamp: "https://notthesinger.bandcamp.com/album/example1",
          soundcloud: "https://soundcloud.com/not-the-singer/sets/perpetual-motion",
          youtube: "https://youtube.com/playlist?list=example1",
          deezer: "https://deezer.com/album/example1",
          tidal: "https://tidal.com/album/example1",
          amazonMusic: "https://music.amazon.com/album/example1"
        }
      },
      {
        id: 2,
        title: "Digital Landscapes",
        type: "Single",
        date: "2024-11-15T00:00:00Z",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=faces",
        duration: 240000,
        track_count: 1,
        links: {
          spotify: "https://open.spotify.com/track/example2",
          apple: "https://music.apple.com/track/example2",
          bandcamp: "https://notthesinger.bandcamp.com/track/digital-landscapes",
          soundcloud: "https://soundcloud.com/not-the-singer/digital-landscapes",
          youtube: "https://youtube.com/watch?v=example2",
          deezer: "https://deezer.com/track/example2",
          tidal: "https://tidal.com/track/example2",
          amazonMusic: "https://music.amazon.com/track/example2"
        }
      },
      {
        id: 3,
        title: "Underground Frequencies",
        type: "EP",
        date: "2024-10-03T00:00:00Z",
        artwork: "https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop&crop=faces",
        duration: 1200000,
        track_count: 3,
        links: {
          spotify: "https://open.spotify.com/album/example3",
          apple: "https://music.apple.com/album/example3",
          bandcamp: "https://notthesinger.bandcamp.com/album/underground-frequencies",
          soundcloud: "https://soundcloud.com/not-the-singer/sets/underground-frequencies",
          youtube: "https://youtube.com/playlist?list=example3",
          deezer: "https://deezer.com/album/example3",
          tidal: "https://tidal.com/album/example3",
          amazonMusic: "https://music.amazon.com/album/example3"
        }
      },
      {
        id: 4,
        title: "Neon Nights",
        type: "Single",
        date: "2024-09-12T00:00:00Z",
        artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop&crop=faces",
        duration: 300000,
        track_count: 1,
        links: {
          spotify: "https://open.spotify.com/track/example4",
          apple: "https://music.apple.com/track/example4",
          bandcamp: "https://notthesinger.bandcamp.com/track/neon-nights",
          soundcloud: "https://soundcloud.com/not-the-singer/neon-nights",
          youtube: "https://youtube.com/watch?v=example4",
          deezer: "https://deezer.com/track/example4",
          tidal: "https://tidal.com/track/example4",
          amazonMusic: "https://music.amazon.com/track/example4"
        }
      }
    ];
  } catch (error) {
    console.error('Error fetching SoundCloud data:', error);
  }
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

// Helper function to format duration
function formatDuration(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
    
    // Create additional info for the new layout
    const trackInfo = album.track_count > 1 ? `${album.track_count} tracks` : '1 track';
    const formattedDate = formatDate(album.date);
    const duration = album.duration ? formatDuration(album.duration) : '';
    
    albumCard.innerHTML = `
      <div class="album-artwork">
        <img src="${album.artwork}" alt="${album.title}" loading="lazy">
      </div>
      <div class="album-info">
        <div class="album-title">${album.title}</div>
        <div class="album-type">${album.type} • ${trackInfo} ${duration ? '• ' + duration : ''}</div>
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
  
  // Set background to blurred album artwork
  detailPage.style.backgroundImage = `url(${album.artwork})`;
  
  // Set album info
  detailArtwork.src = album.artwork;
  detailTitle.textContent = album.title;
  
  // Format metadata
  const trackInfo = album.track_count > 1 ? `${album.track_count} tracks` : '1 track';
  const formattedDate = formatDate(album.date);
  const duration = album.duration ? formatDuration(album.duration) : '';
  detailMeta.textContent = `${album.type} • ${trackInfo} ${duration ? '• ' + duration : ''} • ${formattedDate}`;
  
  // Create streaming links
  streamingLinks.innerHTML = '';
  
  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify' },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple' },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp' },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud' },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer' },
    { key: 'tidal', name: 'Tidal', icon: 'fas fa-music' },
    { key: 'amazonMusic', name: 'Amazon Music', icon: 'fab fa-amazon' }
  ];
  
  streamingPlatforms.forEach(platform => {
    if (album.links[platform.key]) {
      const link = document.createElement('a');
      link.href = album.links[platform.key];
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
  // Initialize SoundCloud data
  fetchSoundCloudData();
  
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
