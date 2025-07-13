let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];

async function fetchSpotifyAlbums() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const spotifyAlbums = await response.json();

    albums = await Promise.all(spotifyAlbums.map(async (album) => {
      const links = await fetchStreamingLinks(album.name);
      return {
        ...album,
        streaming_links: {
          ...links,
          beatport: searchBeatport(album.name, album.artists?.[0]?.name || 'Not the Singer')
        }
      };
    }));

    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  } catch (error) {
    console.error('Spotify fetch failed:', error);
    albums = [{
      id: 'fallback',
      name: 'Offline',
      album_type: 'single',
      release_date: '2024-01-01',
      total_tracks: 1,
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=640&h=640&fit=crop' }],
      external_urls: { spotify: '#' },
      streaming_links: {}
    }];
  }
}

async function fetchStreamingLinks(albumName) {
  try {
    const encoded = encodeURIComponent(`${albumName} Not the Singer`);
    const odesliRes = await fetch(`https://api.song.link/v1-alpha.1/links?url=https://open.spotify.com/album/${encoded}`);
    const data = await odesliRes.json();
    const links = {};

    if (data.linksByPlatform) {
      const p = data.linksByPlatform;
      if (p.spotify) links.spotify = p.spotify.url;
      if (p.appleMusic) links.apple = p.appleMusic.url;
      if (p.bandcamp) links.bandcamp = p.bandcamp.url;
      if (p.soundcloud) links.soundcloud = p.soundcloud.url;
      if (p.youtube) links.youtube = p.youtube.url;
      if (p.deezer) links.deezer = p.deezer.url;
      if (p.tidal) links.tidal = p.tidal.url;
    }
    return links;
  } catch (e) {
    console.error('odesli error:', e);
    return {};
  }
}

function searchBeatport(album, artist) {
  return `https://www.beatport.com/search?q=${encodeURIComponent(artist + ' ' + album)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getAlbumTypeDisplay(type, tracks) {
  return type === 'single' ? (tracks > 1 ? 'EP' : 'Single') : 'Album';
}

function toggleMenu() {
  const dropdown = document.getElementById('menuDropdown');
  const overlay = document.getElementById('menuOverlay');
  const trigger = document.getElementById('menuTrigger');
  isMenuOpen = !isMenuOpen;
  dropdown.classList.toggle('open', isMenuOpen);
  overlay.classList.toggle('active', isMenuOpen);
  trigger.innerHTML = isMenuOpen ? 'Close <i class="fas fa-times"></i>' : 'Menu <i class="fas fa-bars"></i>';
}

function closeMenu() {
  if (isMenuOpen) toggleMenu();
}

function goHome() {
  if (isOnAlbumDetail) return closeAlbumDetail();
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
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';

  if (albums.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading albums...</div>';
    return;
  }

  albums.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card';
    card.onclick = () => showAlbumDetail(album);

    const artwork = album.images?.[0]?.url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop';
    const type = getAlbumTypeDisplay(album.album_type, album.total_tracks);
    const trackInfo = album.total_tracks > 1 ? `${album.total_tracks} tracks` : '1 track';
    const formattedDate = formatDate(album.release_date);

    card.innerHTML = `
      <div class="album-artwork">
        <img src="${artwork}" alt="${album.name}" loading="lazy">
      </div>
      <div class="album-info">
        <div class="album-title">${album.name}</div>
        <div class="album-type">${type} • ${trackInfo}</div>
        <div class="album-date">${formattedDate}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function showAlbumDetail(album) {
  const detail = document.getElementById('albumDetail');
  const artwork = album.images?.[0]?.url || '';

  detail.style.backgroundImage = `url(${artwork})`;
  document.getElementById('detailArtwork').src = artwork;
  document.getElementById('detailTitle').textContent = album.name;
  document.getElementById('detailMeta').textContent = `${getAlbumTypeDisplay(album.album_type, album.total_tracks)} • ${album.total_tracks} track${album.total_tracks > 1 ? 's' : ''} • ${formatDate(album.release_date)}`;

  const linksContainer = document.getElementById('streamingLinks');
  linksContainer.innerHTML = '';

  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify' },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple' },
    { key: 'beatport', name: 'Beatport', icon: 'si si-beatport' },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp' },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud' },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer' },
    { key: 'tidal', name: 'Tidal', icon: 'si si-tidal' }
  ];

  streamingPlatforms.forEach(p => {
    const url = album.streaming_links?.[p.key];
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.className = 'streaming-link';
      a.innerHTML = `<i class="${p.icon}"></i><span>${p.name}</span>`;
      linksContainer.appendChild(a);
    }
  });

  document.getElementById('musicPage').classList.remove('active');
  detail.classList.add('active');
  isOnAlbumDetail = true;
}

function closeAlbumDetail() {
  document.getElementById('albumDetail').classList.remove('active');
  setTimeout(() => {
    document.getElementById('musicPage').classList.add('active');
    isOnAlbumDetail = false;
  }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSpotifyAlbums();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.textContent.includes('Music')) showMusic();
      else closeMenu();
    });
  });

  document.getElementById('menuDropdown').addEventListener('click', e => e.stopPropagation());
});

window.addEventListener('popstate', () => {
  if (isOnAlbumDetail) closeAlbumDetail();
  else if (isOnMusicPage) goHome();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (isOnAlbumDetail) closeAlbumDetail();
    else if (isOnMusicPage) goHome();
    else if (isMenuOpen) closeMenu();
  }
});
