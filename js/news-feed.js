/**
 * BitForward News Feed
 * Integrates real-time cryptocurrency and DeFi news into the platform
 */

class NewsFeed {
    constructor(config = {}) {
        this.apiKey = config.apiKey || 'demo-api-key';
        this.container = config.container || '#news-feed-container';
        this.limit = config.limit || 5;
        this.sources = config.sources || ['crypto-briefing', 'coindesk', 'cointelegraph', 'decrypt', 'bitcoin-magazine'];
        this.topics = config.topics || ['bitcoin', 'ethereum', 'defi', 'enterprise', 'regulation'];
        this.refreshInterval = config.refreshInterval || 600000; // 10 minutes
        this.newsCache = [];
        this.initialized = false;
    }

    /**
     * Initialize the news feed
     */
    async init() {
        if (this.initialized) return;
        
        this.containerElement = document.querySelector(this.container);
        if (!this.containerElement) {
            console.error(`News feed container ${this.container} not found`);
            return;
        }

        try {
            // Create UI elements
            this.renderLayout();
            
            // Load initial news
            await this.fetchNews();
            
            // Set up refresh interval
            this.startAutoRefresh();
            
            // Add event listeners
            this.addEventListeners();
            
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize news feed:', error);
            this.renderError('No se pudieron cargar las noticias');
        }
    }

    /**
     * Create the initial layout for the news feed
     */
    renderLayout() {
        const layout = `
            <div class="news-feed-header">
                <h3 class="section-title-sm">Noticias de Cripto</h3>
                <div class="news-feed-controls">
                    <button class="news-refresh-btn" title="Actualizar noticias">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <div class="news-filter-dropdown">
                        <button class="news-filter-btn" title="Filtrar noticias">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                        <div class="news-filter-menu" style="display: none;">
                            <div class="news-filter-option" data-topic="all">Todas las noticias</div>
                            <div class="news-filter-option" data-topic="bitcoin">Bitcoin</div>
                            <div class="news-filter-option" data-topic="ethereum">Ethereum</div>
                            <div class="news-filter-option" data-topic="defi">DeFi</div>
                            <div class="news-filter-option" data-topic="enterprise">Empresarial</div>
                            <div class="news-filter-option" data-topic="regulation">Regulación</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="news-feed-content">
                <div class="news-loading">
                    <div class="news-loading-spinner"></div>
                    <p>Cargando noticias...</p>
                </div>
            </div>
            <div class="news-feed-footer">
                <a href="#" class="news-view-more">Ver más noticias</a>
            </div>
        `;
        
        this.containerElement.innerHTML = layout;
        this.contentElement = this.containerElement.querySelector('.news-feed-content');
    }

    /**
     * Add event listeners for the news feed controls
     */
    addEventListeners() {
        // Refresh button
        const refreshBtn = this.containerElement.querySelector('.news-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshNews());
        }
        
        // Filter dropdown toggle
        const filterBtn = this.containerElement.querySelector('.news-filter-btn');
        const filterMenu = this.containerElement.querySelector('.news-filter-menu');
        if (filterBtn && filterMenu) {
            filterBtn.addEventListener('click', () => {
                filterMenu.style.display = filterMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!filterBtn.contains(e.target) && !filterMenu.contains(e.target)) {
                    filterMenu.style.display = 'none';
                }
            });
        }
        
        // Filter options
        const filterOptions = this.containerElement.querySelectorAll('.news-filter-option');
        filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                const topic = option.getAttribute('data-topic');
                this.filterNewsByTopic(topic);
                filterMenu.style.display = 'none';
                
                // Update active state
                filterOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
        
        // View more link
        const viewMoreLink = this.containerElement.querySelector('.news-view-more');
        if (viewMoreLink) {
            viewMoreLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.limit += 5;
                this.renderNews(this.newsCache);
            });
        }
    }

    /**
     * Fetch news from the API
     */
    async fetchNews() {
        this.showLoading();
        
        try {
            // In a real implementation, this would be a call to a news API
            // For demo purposes, we'll use mock data
            const data = await this.fetchMockNewsData();
            this.newsCache = data;
            this.renderNews(data);
        } catch (error) {
            console.error('Error fetching news:', error);
            this.renderError('No se pudieron cargar las noticias');
        }
    }
    
    /**
     * Mock news data for demonstration
     */
    async fetchMockNewsData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return [
            {
                id: 1,
                title: 'Bitcoin supera los $70,000 por primera vez en su historia',
                summary: 'La criptomoneda líder ha alcanzado un nuevo máximo histórico impulsada por la demanda institucional y la adopción empresarial.',
                source: 'CoinDesk',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Bitcoin',
                publishedAt: '2025-03-15T10:30:00Z',
                topics: ['bitcoin', 'markets', 'enterprise']
            },
            {
                id: 2,
                title: 'El Banco Central Europeo inicia pruebas con euro digital',
                summary: 'El BCE ha comenzado la fase de pruebas para implementar una versión digital del euro, enfocada en soluciones empresariales y pagos transfronterizos.',
                source: 'Cointelegraph',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Euro+Digital',
                publishedAt: '2025-03-14T14:45:00Z',
                topics: ['regulation', 'enterprise', 'cbdc']
            },
            {
                id: 3,
                title: 'Solana alcanza 100,000 TPS en su última actualización',
                summary: 'La blockchain Solana ha implementado su actualización "Phoenix", multiplicando por diez su capacidad de procesamiento anterior.',
                source: 'Decrypt',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Solana',
                publishedAt: '2025-03-13T09:15:00Z',
                topics: ['solana', 'technology', 'scalability']
            },
            {
                id: 4,
                title: 'La SEC aprueba tres nuevos ETFs de Ethereum',
                summary: 'El regulador estadounidense ha dado luz verde a tres fondos cotizados de Ethereum, abriendo la puerta a mayor inversión institucional.',
                source: 'Bitcoin Magazine',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Ethereum+ETF',
                publishedAt: '2025-03-12T16:20:00Z',
                topics: ['ethereum', 'regulation', 'investment']
            },
            {
                id: 5,
                title: 'DeFi alcanza nuevo récord: $500 mil millones en valor total bloqueado',
                summary: 'El sector de las finanzas descentralizadas continúa creciendo, superando los $500 mil millones en TVL, con protocolos empresariales liderando la adopción.',
                source: 'Crypto Briefing',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=DeFi',
                publishedAt: '2025-03-11T11:10:00Z',
                topics: ['defi', 'enterprise', 'markets']
            },
            {
                id: 6,
                title: 'Forward Contracts DeFi: la nueva tendencia en finanzas empresariales',
                summary: 'Empresas como AFORTU Holdings están liderando la adopción de contratos forward en blockchain, ofreciendo soluciones para gestión de riesgos corporativos.',
                source: 'DeFi Pulse',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Forward+Contracts',
                publishedAt: '2025-03-10T13:25:00Z',
                topics: ['defi', 'enterprise', 'derivatives']
            },
            {
                id: 7,
                title: 'China expande su yuan digital a 20 nuevas ciudades',
                summary: 'El gobierno chino continúa la implementación de su CBDC, ahora disponible en 20 ciudades adicionales con nuevas funcionalidades para empresas.',
                source: 'Coindesk',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=Digital+Yuan',
                publishedAt: '2025-03-09T08:40:00Z',
                topics: ['cbdc', 'regulation', 'china']
            },
            {
                id: 8,
                title: 'JPMorgan lanza su propia plataforma de contratos forward en blockchain',
                summary: 'El gigante bancario ha presentado una solución similar a BitForward, dirigida a clientes corporativos para gestionar exposición a criptoactivos.',
                source: 'The Block',
                url: '#',
                imageUrl: 'https://via.placeholder.com/300x200?text=JPMorgan',
                publishedAt: '2025-03-08T15:50:00Z',
                topics: ['enterprise', 'banking', 'derivatives']
            }
        ];
    }

    /**
     * Render the news items in the container
     */
    renderNews(newsItems) {
        if (!this.contentElement) return;
        
        // Filter and limit items
        const displayedNews = newsItems.slice(0, this.limit);
        
        if (displayedNews.length === 0) {
            this.renderError('No se encontraron noticias');
            return;
        }
        
        // Generate HTML for each news item
        const newsHTML = displayedNews.map(item => this.createNewsItemHTML(item)).join('');
        
        // Update the content
        this.contentElement.innerHTML = `<div class="news-items">${newsHTML}</div>`;
        
        // Update view more button visibility
        const viewMoreLink = this.containerElement.querySelector('.news-view-more');
        if (viewMoreLink) {
            viewMoreLink.style.display = newsItems.length > this.limit ? 'block' : 'none';
        }
    }

    /**
     * Create HTML for a single news item
     */
    createNewsItemHTML(newsItem) {
        // Format the date
        const date = new Date(newsItem.publishedAt);
        const formattedDate = new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
        
        // Topic badges
        const topicBadges = newsItem.topics.map(topic => 
            `<span class="news-topic-badge">${topic}</span>`
        ).join('');
        
        return `
            <div class="news-item" data-id="${newsItem.id}">
                <div class="news-item-image">
                    <img src="${newsItem.imageUrl}" alt="${newsItem.title}" onerror="this.src='https://via.placeholder.com/300x200?text=BitForward'">
                </div>
                <div class="news-item-content">
                    <div class="news-source-date">
                        <span class="news-source">${newsItem.source}</span>
                        <span class="news-date">${formattedDate}</span>
                    </div>
                    <h4 class="news-title">${newsItem.title}</h4>
                    <p class="news-summary">${newsItem.summary}</p>
                    <div class="news-footer">
                        <div class="news-topics">
                            ${topicBadges}
                        </div>
                        <a href="${newsItem.url}" class="news-read-more" target="_blank" rel="noopener noreferrer">Leer más</a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Filter news by topic
     */
    filterNewsByTopic(topic) {
        if (topic === 'all') {
            this.renderNews(this.newsCache);
            return;
        }
        
        const filteredNews = this.newsCache.filter(news => 
            news.topics.includes(topic)
        );
        
        this.renderNews(filteredNews);
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        if (!this.contentElement) return;
        
        this.contentElement.innerHTML = `
            <div class="news-loading">
                <div class="news-loading-spinner"></div>
                <p>Cargando noticias...</p>
            </div>
        `;
    }

    /**
     * Render error message
     */
    renderError(message) {
        if (!this.contentElement) return;
        
        this.contentElement.innerHTML = `
            <div class="news-error">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>${message}</p>
                <button class="news-retry-btn">Reintentar</button>
            </div>
        `;
        
        // Add retry button listener
        const retryBtn = this.contentElement.querySelector('.news-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.fetchNews());
        }
    }

    /**
     * Start auto-refresh interval
     */
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.fetchNews();
        }, this.refreshInterval);
    }

    /**
     * Stop auto-refresh interval
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    /**
     * Manually refresh the news feed
     */
    async refreshNews() {
        await this.fetchNews();
    }

    /**
     * Clean up resources when the component is destroyed
     */
    destroy() {
        this.stopAutoRefresh();
        this.initialized = false;
    }
}

// Export the NewsFeed class for use in other modules
window.NewsFeed = NewsFeed;
