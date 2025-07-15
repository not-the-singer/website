let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;

const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];
let streamingLinksCache = {}; // Cache to store streaming links

// Simplified categorization based on duration
function determineTrackType(title, duration) {
  const durationMinutes = duration / 1000 / 60;
  return durationMinutes > 15 ? 'mix' : 'remix';
}

// High quality artwork
function getHighQualityArtwork(track) {
  if (track.artwork_url) {
    return track.artwork_url.replace('-large.jpg', '-t500x500.jpg');
  }
  
  if (track.user && track.user.avatar_url) {
    return track.user.avatar_url.replace('-large.jpg', '-t500x500.jpg');
  }
  
  return 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=500&fit=crop';
}

// Fetch SoundCloud tracks with duplicate filtering
async function fetchSoundCloudTracks(spotifyTrackNames) {
  try {
    console.log('Fetching tracks from SoundCloud via API proxy...');
    
    const response = await fetch(`${API_BASE_URL}/api/soundcloud`);
    
    if (!response.ok) {
      throw new Error(`SoundCloud API responded with status: ${response.status}`);
    }
    
    const tracks = await response.json();
    console.log('Raw SoundCloud data:', tracks);
    
    // Filter to only include public tracks that aren't duplicates of Spotify
    const filteredTracks = tracks.filter(track => {
      // Skip private tracks
      if (track.sharing === 'private') return false;
      
      // Skip if track name matches any Spotify track
      const isDuplicate = spotifyTrackNames.some(spotifyName => 
        spotifyName.toLowerCase() === track.title.toLowerCase()
      );
      
      return !isDuplicate;
    });
    
    return filteredTracks.map(track => ({
      id: `sc_${track.id}`,
      name: track.title,
      album_type: determineTrackType(track.title, track.duration),
      release_date: track.created_at.split('T')[0],
      total_tracks: 1,
      images: [{ url: getHighQualityArtwork(track) }],
      external_urls: { soundcloud: track.permalink_url },
      streaming_links: {
        soundcloud: track.permalink_url
      },
      source: 'soundcloud'
    }));
  } catch (error) {
    console.error('Error fetching SoundCloud tracks:', error);
    return [];
  }
}

// Combined fetch function
async function fetchAllMusic() {
  try {
    console.log('Fetching all music from Spotify and SoundCloud...');
    
    const [spotifyResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/spotify`)
    ]);
    
    const spotifyAlbums = spotifyResponse.ok ? await spotifyResponse.json() : [];
    
    // Extract all Spotify album names for duplicate checking
    const spotifyTrackNames = spotifyAlbums.map(album => album.name);
    
    // Now fetch SoundCloud tracks with duplicate filtering
    const soundcloudTracks = await fetchSoundCloudTracks(spotifyTrackNames);
    
    // Process Spotify albums (with streaming links)
    const processedSpotifyAlbums = await Promise.all(spotifyAlbums.map(async (album) => {
      const cacheKey = `${album.id}_${album.name}`;
      let streamingLinks;
      
      if (streamingLinksCache[cacheKey]) {
        streamingLinks = streamingLinksCache[cacheKey];
      } else {
        streamingLinks = await fetchStreamingLinks(album);
        streamingLinksCache[cacheKey] = streamingLinks;
      }

      return {
        ...album,
        streaming_links: streamingLinks,
        source: 'spotify'
      };
    }));
    
    // Combine all music
    albums = [...processedSpotifyAlbums, ...soundcloudTracks]
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    
    console.log('All music loaded:', albums);
    
  } catch (error) {
    console.error('Error fetching all music:', error);
    albums = [];
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
      if (platforms.beatport) links.beatport = platforms.beatport.url;
    }

    // Get fallback search URLs for missing platforms
    const fallbackLinks = getSearchFallbackLinks(album.name);
    
    // Merge: use Songlink data if available, otherwise use search fallbacks
    const finalLinks = { ...fallbackLinks, ...links };

    console.log(`Final links for ${album.name}:`, finalLinks);
    return finalLinks;
  } catch (error) {
    console.error(`Error fetching streaming links for ${album.name}:`, error);
    return getSearchFallbackLinks(album.name);
  }
}

function getSearchFallbackLinks(albumName) {
  const artistName = 'Not the Singer';
  const searchQuery = encodeURIComponent(`${artistName} ${albumName}`);
  
  return {
    spotify: `https://open.spotify.com/search/${searchQuery}`,
    apple: `https://music.apple.com/search?term=${searchQuery}`,
    beatport: `https://www.beatport.com/search?q=${searchQuery}`,
    bandcamp: `https://bandcamp.com/search?q=${searchQuery}`,
    soundcloud: `https://soundcloud.com/search?q=${searchQuery}`,
    youtube: `https://www.youtube.com/results?search_query=${searchQuery}`,
    deezer: `https://www.deezer.com/en/search/${searchQuery}`,
    tidal: `https://tidal.com/artist/23342714`
  };
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getAlbumTypeDisplay(type, tracks) {
  return type === 'single' ? (tracks > 1 ? 'EP' : 'Single') : 
         type === 'remix' ? 'Remix' :
         type === 'mix' ? 'Mix' : 'Album';
}

// Filter functionality
let currentFilter = 'all';
let filtersSetup = false;

function setupFilters() {
  // COMPLETELY DISABLE FILTERS FOR TESTING
  console.log('Filters disabled for testing');
  return;
}

function getFilteredAlbums() {
  if (currentFilter === 'all') {
    return albums;
  }
  
  return albums.filter(album => {
    if (currentFilter === 'album') {
      return album.source === 'spotify' || album.album_type === 'album';
    }
    return album.album_type === currentFilter;
  });
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
  document.getElementById('musicPage').classList.add('active');
  isOnMusicPage = true;
  
  // Set up filters and load albums
  setupFilters();
  loadAlbums();
  
  closeMenu();
}

function loadAlbums() {
  // Guard: don't reload if album detail is open
  if (isOnAlbumDetail) {
    return;
  }
  
  const grid = document.getElementById('albumGrid');
  grid.innerHTML = '';

  const filteredAlbums = getFilteredAlbums();

  if (filteredAlbums.length === 0) {
    grid.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No items found...</div>';
    return;
  }

  filteredAlbums.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card';
    
    // Use addEventListener with stopPropagation to prevent event bubbling
    card.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      showAlbumDetail(album);
    });

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
  isOnAlbumDetail = true;
  
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
}

function closeAlbumDetail() {
  isOnAlbumDetail = false;
  document.getElementById('albumDetail').classList.remove('active');
  
  setTimeout(() => {
    if (isOnMusicPage) {
      document.getElementById('musicPage').classList.add('active');
    }
  }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAllMusic();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (item.textContent.includes('Music')) {
        showMusic();
      } else {
        closeMenu();
      }
    });
  });

  document.getElementById('menuDropdown').addEventListener('click', e => e.stopPropagation());
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (isOnAlbumDetail) {
      closeAlbumDetail();
    } else if (isOnMusicPage) {
      goHome();
    } else if (isMenuOpen) {
      closeMenu();
    }
  }
});

// Debug function
window.debugStates = function() {
  console.log('=== DEBUG STATES ===');
  console.log('isOnMusicPage:', isOnMusicPage);
  console.log('isOnAlbumDetail:', isOnAlbumDetail);
  console.log('isMenuOpen:', isMenuOpen);
  
  const detail = document.getElementById('albumDetail');
  const musicPage = document.getElementById('musicPage');
  
  console.log('Album detail classes:', detail.className);
  console.log('Music page classes:', musicPage.className);
  console.log('Detail opacity:', window.getComputedStyle(detail).opacity);
  console.log('Music page opacity:', window.getComputedStyle(musicPage).opacity);
};
