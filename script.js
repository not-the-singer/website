let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

// Sample album data (in real implementation, this would come from SoundCloud API)
const albums = [
  {
    id: 1,
    title: "Perpetual Motion",
    type: "EP",
    date: "23 Dec 2024",
    artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&crop=faces",
    links: {
      spotify: "https://open.spotify.com/album/example1",
      apple: "https://music.apple.com/album/example1",
      bandcamp: "https://notthesinger.bandcamp.com/album/example1",
      soundcloud: "https://soundcloud.com/not-the-singer/example1",
      youtube: "https://youtube.com/watch?v=example1",
      deezer: "https://deezer.com/album/example1",
      tidal: "https://tidal.com/album/example1",
      amazonMusic: "https://music.amazon.com/album/example1"
    }
  },
  {
    id: 2,
    title: "Digital Landscapes",
    type: "Single",
    date: "15 Nov 2024",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=faces",
    links: {
      spotify: "https://open.spotify.com/album/example2",
      apple: "https://music.apple.com/album/example2",
      bandcamp: "https://notthesinger.bandcamp.com/album/example2",
      soundcloud: "https://soundcloud.com/not-the-singer/example2",
      youtube: "https://youtube.com/watch?v=example2",
      deezer: "https://deezer.com/album/example2",
      tidal: "https://tidal.com/album/example2",
      amazonMusic: "https://music.amazon.com/album/example2"
    }
  },
  {
    id: 3,
    title: "Underground Frequencies",
    type: "EP",
    date: "03 Oct 2024",
    artwork: "https://images.unsplash.com/photo-1571974599782-87624638275c?w=400&h=400&fit=crop&crop=faces",
    links: {
      spotify: "https://open.spotify.com/album/example3",
      apple: "https://music.apple.com/album/example3",
      bandcamp: "https://notthesinger.bandcamp.com/album/example3",
      soundcloud: "https://soundcloud.com/not-the-singer/example3",
      youtube: "https://youtube.com/watch?v=example3",
      deezer: "https://deezer.com/album/example3",
      tidal: "https://tidal.com/album/example3",
      amazonMusic: "https://music.amazon.com/album/example3"
    }
  },
  {
    id: 4,
    title: "Neon Nights",
    type: "Single",
    date: "12 Sep 2024",
    artwork: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop&crop=faces",
    links: {
      spotify: "https://open.spotify.com/album/example4",
      apple: "https://music.apple.com/album/example4",
      bandcamp: "https://notthesinger.bandcamp.com/album/example4",
      soundcloud: "https://soundcloud.com/not-the-singer/example4",
      youtube: "https://youtube.com/watch?v=example4",
      deezer: "https://deezer.com/album/example4",
      tidal: "https://tidal.com/album/example4",
      amazonMusic: "https://music.amazon.com/album/example4"
    }
  }
];

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
    
    albumCard.innerHTML = `
      <div class="album-artwork">
        <img src="${album.artwork}" alt="${album.title}" loading="lazy">
      </div>
      <div class="album-info">
        <div class="album-title">${album.title}</div>
        <div class="album-type">${album.type}</div>
        <div class="album-date">${album.date}</div>
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
  detailMeta.textContent = `${album.type} • ${album.date}`;
  
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
