// State management
let isMenuOpen = false;
let isOnMusicPage = false;
let isOnAlbumDetail = false;
let transitionInProgress = false;

const API_BASE_URL = 'https://not-the-singer-api.vercel.app';
let albums = [];
let streamingLinksCache = {};

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
    
    // First try the regular request
    let response = await fetch(`${API_BASE_URL}/api/soundcloud`);
    
    // If we get a 401 or 500, try to refresh the token
    if (response.status === 401 || response.status === 500) {
      console.log('Token expired, attempting refresh...');
      
      // Call token refresh endpoint
      const refreshResponse = await fetch(`${API_BASE_URL}/api/soundcloud/refresh`, {
        method: 'POST'
      });
      
      if (!refreshResponse.ok) {
        throw new Error(`Token refresh failed: ${refreshResponse.status}`);
      }
      
      // Retry the original request
      response = await fetch(`${API_BASE_URL}/api/soundcloud`);
    }
    
    if (!response.ok) {
      throw new Error(`SoundCloud API responded with status: ${response.status}`);
    }
    
    const tracks = await response.json();
    console.log('Raw SoundCloud data:', tracks);
    
    if (!tracks || !Array.isArray(tracks)) {
      console.warn('Invalid tracks data received:', tracks);
      return [];
    }
    
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
    
    // Show error state in UI
    const grid = document.getElementById('albumGrid');
    if (grid) {
      const errorMessage = document.createElement('div');
      errorMessage.style.cssText = 'text-align: center; padding: 40px; color: #666;';
      errorMessage.innerHTML = `
        <div>Unable to load SoundCloud tracks</div>
        <button onclick="retryFetchSoundCloud()" 
                style="margin-top: 10px; padding: 8px 16px; background: rgba(255,255,255,0.1); 
                       border: 1px solid rgba(255,255,255,0.2); color: white; border-radius: 20px; 
                       cursor: pointer;">
          Retry
        </button>
      `;
      grid.appendChild(errorMessage);
    }
    
    return [];
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

// Prevent multiple rapid transitions
function preventMultipleTransitions(callback) {
  if (transitionInProgress) return;
  transitionInProgress = true;
  
  callback();
  
  setTimeout(() => {
    transitionInProgress = false;
  }, 600);
}

// Filter functionality
let currentFilter = 'all';
let filtersSetup = false;

function setupFilters() {
  if (filtersSetup) return;
  
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (isOnAlbumDetail) return;
      
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentFilter = button.dataset.filter;
      
      loadAlbums();
    });
  });
  
  filtersSetup = true;
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
  if (isOnAlbumDetail) return;
  
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
    // Do nothing when album detail is open
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
  
  setupFilters();
  loadAlbums();
  
  closeMenu();
}

function loadAlbums() {
  if (isOnAlbumDetail) return;
  
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

// Show album detail with fixed transition handling
function showAlbumDetail(album) {
  preventMultipleTransitions(() => {
    console.log('Opening album detail for:', album.name);
    
    isOnAlbumDetail = true;
    const detail = document.getElementById('albumDetail');
    const artwork = album.images?.[0]?.url || '';
    
    // Set content before showing
    detail.style.backgroundImage = `url(${artwork})`;
    document.getElementById('detailArtwork').src = artwork;
    document.getElementById('detailTitle').textContent = album.name;
    document.getElementById('detailMeta').textContent = 
      `${getAlbumTypeDisplay(album.album_type, album.total_tracks)} • 
       ${album.total_tracks} track${album.total_tracks > 1 ? 's' : ''} • 
       ${formatDate(album.release_date)}`;
    
    // Handle streaming links
    setupStreamingLinks(album);
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      document.getElementById('musicPage').classList.remove('active');
      requestAnimationFrame(() => {
        detail.classList.add('active');
      });
    });
  });
}

// Close album detail with fixed transition timing
function closeAlbumDetail() {
  preventMultipleTransitions(() => {
    console.log('Closing album detail');
    const detail = document.getElementById('albumDetail');
    
    // Remove active class first
    detail.classList.remove('active');
    
    // Wait for transition to complete before state change
    setTimeout(() => {
      isOnAlbumDetail = false;
      if (isOnMusicPage) {
        document.getElementById('musicPage').classList.add('active');
      }
    }, 300);
  });
}

// Setup streaming links with improved error handling
function setupStreamingLinks(album) {
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
      
      let iconHTML = platform.icon.startsWith('simple-icons') 
        ? `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/${platform.key}.svg" 
              style="width: 18px; height: 18px; filter: invert(1);">`
        : `<i class="${platform.icon}"></i>`;
      
      link.innerHTML = `${iconHTML}<span>${platform.name}</span>`;
      linksContainer.appendChild(link);
    }
  });
  
}

async function fetchAllMusic() {
  try {
    console.log('Fetching all music...');
    
    // Initialize with an empty array for Spotify track names
    // This prevents duplicate tracks when fetching from SoundCloud
    const spotifyTrackNames = [];
    
    // Fetch SoundCloud tracks
    const soundcloudTracks = await fetchSoundCloudTracks(spotifyTrackNames);
    
    // Combine all tracks
    albums = [...soundcloudTracks];
    
    // Sort by release date, newest first
    albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
    
    // Load the albums if we're on the music page
    if (isOnMusicPage) {
      loadAlbums();
    }
  } catch (error) {
    console.error('Error fetching music:', error);
  }
}

// Initialize on page load
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
  
  // Event listeners
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (isOnAlbumDetail) closeAlbumDetail();
      else if (isOnMusicPage) goHome();
      else if (isMenuOpen) closeMenu();
    }
  });
});
