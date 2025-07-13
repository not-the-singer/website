let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];

async function fetchSpotifyAlbums() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify`);
    if (!response.ok) throw new Error(`API responded with status: ${response.status}`);

    const spotifyAlbums = await response.json();

    albums = await Promise.all(spotifyAlbums.map(async (album) => {
      const streaming_links = await fetchStreamingLinks(album.external_urls.spotify);
      streaming_links.beatport = await searchBeatport(album.name, album.artists[0].name);

      return {
        id: album.id,
        name: album.name,
        album_type: album.album_type,
        release_date: album.release_date,
        release_date_precision: album.release_date_precision,
        total_tracks: album.total_tracks,
        images: album.images,
        external_urls: album.external_urls,
        streaming_links
      };
    }));

    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

  } catch (error) {
    console.error('Error fetching Spotify albums:', error);
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

async function fetchStreamingLinks(spotifyUrl) {
  try {
    const res = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(spotifyUrl)}`);
    const data = await res.json();
    const links = data.linksByPlatform;

    return {
      spotify: links.spotify?.url || null,
      apple: links.appleMusic?.url || null,
      bandcamp: links.bandcamp?.url || null,
      soundcloud: links.soundcloud?.url || null,
      youtube: links.youtube?.url || null,
      deezer: links.deezer?.url || null,
      tidal: links.tidal?.url || null
    };
  } catch (err) {
    console.error('Error fetching streaming links:', err);
    return {};
  }
}

async function searchBeatport(album, artist) {
  return `https://www.beatport.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
}

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
  if (isMenuOpen) toggleMenu();
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

  albums.forEach((album) => {
    const albumCard = document.createElement('div');
    albumCard.className = 'album-card';
    albumCard.onclick = () => showAlbumDetail(album);

    const artwork = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop';
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

  const artwork = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop';

  detailPage.style.backgroundImage = `url(${artwork})`;
  detailArtwork.src = artwork;
  detailTitle.textContent = album.name;

  const albumType = getAlbumTypeDisplay(album.album_type, album.total_tracks);
  const trackInfo = album.total_tracks > 1 ? `${album.total_tracks} tracks` : '1 track';
  const formattedDate = formatDate(album.release_date);
  detailMeta.textContent = `${albumType} • ${trackInfo} • ${formattedDate}`;

  streamingLinks.innerHTML = '';

  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify' },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple' },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp' },
    { key: 'beatport', name: 'Beatport', icon: 'si si-beatport' },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud' },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer' },
    { key: 'tidal', name: 'Tidal', icon: 'si si-tidal' }
  ];

  streamingPlatforms.forEach(platform => {
    const url = album.streaming_links?.[platform.key];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = 'streaming-link';
      link.innerHTML = `<i class="${platform.icon}"></i><span>${platform.name}</span>`;
      streamingLinks.appendChild(link);
    }
  });

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

document.addEventListener('DOMContentLoaded', function() {
  fetchSpotifyAlbums();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
      if (this.textContent.trim().includes('Music')) {
        showMusic();
      } else {
        closeMenu();
      }
    });
  });

  document.getElementById('menuDropdown').addEventListener('click', function(event) {
    event.stopPropagation();
  });
});

window.addEventListener('popstate', function() {
  if (isOnAlbumDetail) closeAlbumDetail();
  else if (isOnMusicPage) goHome();
});

document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    if (isOnAlbumDetail) closeAlbumDetail();
    else if (isOnMusicPage) goHome();
    else if (isMenuOpen) closeMenu();
  }
});
