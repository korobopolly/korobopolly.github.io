// Dark Mode Toggle
function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');
  if (sunIcon && moonIcon) {
    if (isDark) {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }
}

function initDarkMode() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  // Initialize icon state
  updateThemeIcon();

  // Toggle theme on button click
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
  });
}

// Mobile Menu Toggle
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (!menuBtn || !mobileMenu) return;

  menuBtn.addEventListener('click', () => {
    const isActive = mobileMenu.classList.toggle('active');
    menuBtn.classList.toggle('active');

    // Update aria-label
    if (isActive) {
      menuBtn.setAttribute('aria-label', 'Close menu');
    } else {
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('active');
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-label', 'Open menu');
    }
  });

  // Close mobile menu when clicking a link
  const menuLinks = mobileMenu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      menuBtn.classList.remove('active');
      menuBtn.setAttribute('aria-label', 'Open menu');
    });
  });
}

// Code Copy Button
function initCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre > code');

  codeBlocks.forEach((codeBlock) => {
    const pre = codeBlock.parentElement;

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    // Add button to pre element
    pre.style.position = 'relative';
    pre.appendChild(copyBtn);

    // Copy functionality
    copyBtn.addEventListener('click', async () => {
      const code = codeBlock.textContent;

      try {
        await navigator.clipboard.writeText(code);

        // Show "Copied!" feedback
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');

        // Revert after 2 seconds
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        copyBtn.textContent = 'Failed';

        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      }
    });
  });
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Skip if href is just "#"
      if (href === '#') return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without triggering scroll
        if (history.pushState) {
          history.pushState(null, null, href);
        }
      }
    });
  });
}

// Reading Progress Bar
function initReadingProgress() {
  const progressBar = document.getElementById('reading-progress');
  if (!progressBar) return;

  // Only show on single post pages with substantial content
  const postContent = document.querySelector('.post-content');
  if (!postContent) {
    progressBar.style.display = 'none';
    return;
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;

    progressBar.style.width = scrollPercent + '%';
  });
}

// Table of Contents
function initTableOfContents() {
  const toc = document.getElementById('toc-content');
  if (!toc) return;

  const postContent = document.querySelector('.post-content');
  if (!postContent) return;

  // Find all h2 and h3 headings
  const headings = postContent.querySelectorAll('h2, h3');
  if (headings.length === 0) {
    // Hide TOC if no headings
    const tocContainer = document.querySelector('.toc');
    if (tocContainer) tocContainer.style.display = 'none';
    return;
  }

  // Build TOC list
  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';

  headings.forEach((heading, index) => {
    // Ensure heading has an ID
    if (!heading.id) {
      heading.id = 'heading-' + index;
    }

    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + heading.id;
    link.className = 'toc-link';
    link.textContent = heading.textContent;

    // Indent h3 items
    if (heading.tagName === 'H3') {
      li.style.marginLeft = '1rem';
    }

    li.appendChild(link);
    tocList.appendChild(li);
  });

  toc.appendChild(tocList);

  // Highlight active section on scroll using IntersectionObserver
  const observerOptions = {
    rootMargin: '-100px 0px -66%',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const tocLink = toc.querySelector(`a[href="#${id}"]`);

      if (entry.isIntersecting) {
        // Remove active class from all links
        toc.querySelectorAll('.toc-link').forEach(link => {
          link.classList.remove('active');
        });
        // Add active class to current link
        if (tocLink) {
          tocLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  // Observe all headings
  headings.forEach(heading => {
    observer.observe(heading);
  });
}

// Search Functionality
function initSearch() {
  const searchBtn = document.getElementById('search-toggle');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const closeBtn = document.querySelector('.search-close');

  if (!searchOverlay || !searchInput || !searchResults) return;

  let fuse = null;

  // Load search index
  fetch('/index.json')
    .then(response => response.json())
    .then(data => {
      fuse = new Fuse(data, {
        keys: ['title', 'content', 'tags'],
        threshold: 0.3,
        includeMatches: true
      });
    })
    .catch(err => console.error('Failed to load search index:', err));

  // Open search overlay
  function openSearch() {
    searchOverlay.classList.add('active');
    searchInput.focus();
  }

  // Close search overlay
  function closeSearch() {
    searchOverlay.classList.remove('active');
    searchInput.value = '';
    searchResults.innerHTML = '';
  }

  // Search button click
  if (searchBtn) {
    searchBtn.addEventListener('click', openSearch);
  }

  // Close button click
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSearch);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or Cmd+K to open
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    // Escape to close
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // Click overlay background to close
  searchOverlay.addEventListener('click', (e) => {
    if (e.target === searchOverlay) {
      closeSearch();
    }
  });

  // Debounced search on input
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();

    if (query.length < 2) {
      searchResults.innerHTML = '<div class="search-hint">Ctrl+K로 검색</div>';
      return;
    }

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 200);
  });

  function performSearch(query) {
    if (!fuse) {
      searchResults.innerHTML = '<div class="search-no-results">검색 인덱스를 불러오는 중...</div>';
      return;
    }

    const results = fuse.search(query);

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">검색 결과가 없습니다</div>';
      return;
    }

    const html = results.map(result => {
      const item = result.item;
      const snippet = getSnippet(item.content);

      return `
        <a href="${item.permalink}" class="search-result-item">
          <div class="search-result-title">${highlightMatches(item.title, result.matches, 'title')}</div>
          <div class="search-result-date">${item.date}</div>
          <div class="search-result-snippet">${highlightMatches(snippet, result.matches, 'content')}</div>
        </a>
      `;
    }).join('');

    searchResults.innerHTML = html;
  }

  function getSnippet(content) {
    const maxLength = 150;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  function highlightMatches(text, matches, key) {
    if (!matches) return text;

    const relevantMatches = matches.filter(m => m.key === key);
    if (relevantMatches.length === 0) return text;

    let highlighted = text;
    const indices = relevantMatches[0].indices;

    // Sort indices in reverse to avoid offset issues
    indices.sort((a, b) => b[0] - a[0]);

    indices.forEach(([start, end]) => {
      const before = highlighted.substring(0, start);
      const match = highlighted.substring(start, end + 1);
      const after = highlighted.substring(end + 1);
      highlighted = before + '<mark>' + match + '</mark>' + after;
    });

    return highlighted;
  }
}

// Code Language Labels
function initCodeLanguageLabels() {
  const codeBlocks = document.querySelectorAll('pre > code');

  // Language name mappings
  const languageMap = {
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'go': 'Go',
    'bash': 'Bash',
    'sh': 'Shell',
    'shell': 'Shell',
    'yaml': 'YAML',
    'yml': 'YAML',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS',
    'toml': 'TOML',
    'md': 'Markdown',
    'markdown': 'Markdown'
  };

  codeBlocks.forEach(codeBlock => {
    const pre = codeBlock.parentElement;

    // Extract language from class name
    const classNames = codeBlock.className.split(' ');
    let language = '';

    for (const className of classNames) {
      if (className.startsWith('language-')) {
        language = className.replace('language-', '');
        break;
      }
    }

    if (!language) return;

    // Map to display name
    const displayName = languageMap[language.toLowerCase()] || language;

    // Create language label
    const label = document.createElement('span');
    label.className = 'code-lang-label';
    label.textContent = displayName;

    // Insert label at the top of pre element
    pre.insertBefore(label, pre.firstChild);
  });
}

// Download Buttons (MD / PDF)
function initDownloadButtons() {
  const mdBtn = document.getElementById('download-md');
  const pdfBtn = document.getElementById('download-pdf');

  if (!mdBtn && !pdfBtn) return;

  const titleEl = document.querySelector('.post-title');
  const rawTitle = titleEl ? titleEl.textContent.trim().replace(/\s+/g, ' ') : 'post';
  const safeFileName = rawTitle.replace(/[\\/:*?"<>|]/g, '_');

  // MD Download
  if (mdBtn) {
    mdBtn.addEventListener('click', () => {
      const rawEl = document.getElementById('post-raw-content');
      if (!rawEl) return;

      const content = rawEl.value;

      const frontmatter = `---\ntitle: "${rawTitle}"\nurl: ${window.location.href}\n---\n\n`;
      const blob = new Blob([frontmatter + content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = safeFileName + '.md';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // PDF Download (via print dialog)
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// Initialize all functions when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initMobileMenu();
  initCodeCopyButtons();
  initSmoothScroll();
  initReadingProgress();
  initTableOfContents();
  initSearch();
  initCodeLanguageLabels();
  initDownloadButtons();
});
