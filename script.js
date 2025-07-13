let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];
let streamingLinksCache = {}; // Cache to store streaming links

async function fetchSpotifyAlbums() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const spotifyAlbums = await response.json();

    albums = await Promise.all(spotifyAlbums.map(async (album) => {
      // Check if we already have cached links for this album
      const cacheKey = `${album.id}_${album.name}`;
      let streamingLinks;
      
      if (streamingLinksCache[cacheKey]) {
        console.log(`Using cached links for: ${album.name}`);
        streamingLinks = streamingLinksCache[cacheKey];
      } else {
        console.log(`Fetching new links for: ${album.name}`);
        streamingLinks = await fetchStreamingLinks(album);
        // Cache the result
        streamingLinksCache[cacheKey] = streamingLinks;
      }

      return {
        ...album,
        streaming_links: streamingLinks
      };
    }));

    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    console.log('Processed albums with streaming links:', albums);
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

async function fetchStreamingLinks(album) {
  try {
    const spotifyUrl = album.external_urls?.spotify;
    if (!spotifyUrl) {
      console.warn(`No Spotify URL for album: ${album.name}`);
      return getSearchFallbackLinks(album.name);
    }

    console.log(`Fetching Songlink data for: ${album.name} - ${spotifyUrl}`);
    
    const songLinkResponse = await fetch(`${API_BASE_URL}/api/songlink?spotifyUrl=${encodeURIComponent(spotifyUrl)}`);
    
    if (!songLinkResponse.ok) {
      throw new Error(`Songlink API error: ${songLinkResponse.status}`);
    }
    
    const data = await songLinkResponse.json();
    console.log(`Songlink response for ${album.name}:`, data);
    
    const links = {};

    // Extract available links from Songlink
    if (data.linksByPlatform) {
      const platforms = data.linksByPlatform;
      
      if (platforms.spotify) links.spotify = platforms.spotify.url;
      if (platforms.appleMusic) links.apple = platforms.appleMusic.url;
      if (platforms.bandcamp) links.bandcamp = platforms.bandcamp.url;
      if (platforms.soundcloud) links.soundcloud = platforms.soundcloud.url;
      if (platforms.youtube || platforms.youtubeMusic) {
        links.youtube = platforms.youtubeMusic?.url || platforms.youtube?.url;
      }
      if (platforms.deezer) links.deezer = platforms.deezer.url;
      if (platforms.tidal) links.tidal = platforms.tidal.url;
      if (platforms.beatport) links.beatport = platforms.beatport.url; // Future-proof for Beatport
    }

    // Get fallback search URLs for missing platforms
    const fallbackLinks = getSearchFallbackLinks(album.name);
    
    // Merge: use Songlink data if available, otherwise use search fallbacks
    const finalLinks = { ...fallbackLinks, ...links };

    console.log(`Final links for ${album.name}:`, finalLinks);
    return finalLinks;
  } catch (error) {
    console.error(`Error fetching streaming links for ${album.name}:`, error);
    // Return complete fallback if Songlink completely fails
    return getSearchFallbackLinks(album.name);
  }
}

function getSearchFallbackLinks(albumName) {
  const artistName = 'Not the Singer';
  const fullQuery = encodeURIComponent(`${artistName} ${albumName}`);
  
  return {
    spotify: `https://open.spotify.com/search/${fullQuery}`,
    apple: `https://music.apple.com/search?term=${fullQuery}`,
    beatport: `https://www.beatport.com/search?q=${fullQuery}`,
    bandcamp: `https://bandcamp.com/search?q=${fullQuery}`,
    soundcloud: `https://soundcloud.com/search?q=${fullQuery}`, // Search instead of artist page
    youtube: `https://www.youtube.com/results?search_query=${fullQuery}`,
    deezer: `https://www.deezer.com/en/search/${fullQuery}`,
    tidal: `https://tidal.com/artist/23342714` // Direct artist page to avoid login
  };
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

  // Updated platforms list (removed Amazon Music, kept even number)
  const streamingPlatforms = [
    { key: 'spotify', name: 'Spotify', icon: 'fab fa-spotify' },
    { key: 'apple', name: 'Apple Music', icon: 'fab fa-apple' },
    { key: 'beatport', name: 'Beatport', icon: 'simple-icons-beatport' },
    { key: 'bandcamp', name: 'Bandcamp', icon: 'fab fa-bandcamp' },
    { key: 'soundcloud', name: 'SoundCloud', icon: 'fab fa-soundcloud' },
    { key: 'youtube', name: 'YouTube', icon: 'fab fa-youtube' },
    { key: 'deezer', name: 'Deezer', icon: 'fab fa-deezer' },
    { key: 'tidal', name: 'Tidal', icon: 'simple-icons-tidal' }
  ];

  streamingPlatforms.forEach(platform => {
    const url = album.streaming_links?.[platform.key];
    if (url && url !== '#') {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = 'streaming-link';
      
      // Handle Simple Icons differently
      let iconHTML;
      if (platform.icon === 'simple-icons-beatport') {
        iconHTML = `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/beatport.svg" style="width: 18px; height: 18px; filter: invert(1);">`;
      } else if (platform.icon === 'simple-icons-tidal') {
        iconHTML = `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/tidal.svg" style="width: 18px; height: 18px; filter: invert(1);">`;
      } else {
        iconHTML = `<i class="${platform.icon}"></i>`;
      }
      
      link.innerHTML = `${iconHTML}<span>${platform.name}</span>`;
      linksContainer.appendChild(link);
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
