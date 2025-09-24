(function() {
    // Объект для управления закладками
    if (typeof window.pdfJsBookmarks === 'undefined') {
        window.pdfJsBookmarks = {
            instances: {},

            init: function(containerId, config) {
                console.log('Initializing bookmarks for:', containerId);

                // Проверяем config
                if (!config) {
                    config = { pdfUrl: window.location.href };
                }

                // Создаем экземпляр
                this.instances[containerId] = {
                    config: config,
                    currentPage: 1,
                    bookmarks: []
                };

                console.log('Instance created for:', containerId);

                this.loadBookmarks(containerId);
                this.setupPdfListeners(containerId);
                this.applySavedPanelState(containerId);
            },

            setupPdfListeners: function(containerId) {
                const iframe = document.getElementById('pdfjs-' + containerId);
                const instance = this.instances[containerId];

                if (!iframe) {
                    console.error('Iframe not found:', 'pdfjs-' + containerId);
                    return;
                }

                // Периодическая проверка текущей страницы
                instance.checkInterval = setInterval(() => {
                    this.updateCurrentPage(containerId);
                }, 2000);

                // Слушаем сообщения от iframe
                window.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'pdfPageChange') {
                        const instance = window.pdfJsBookmarks.instances[containerId];
                        if (instance) {
                            instance.currentPage = event.data.page;
                        }
                    }
                });
            },

            updateCurrentPage: function(containerId) {
                const iframe = document.getElementById('pdfjs-' + containerId);
                if (!iframe || !iframe.contentWindow) return;

                try {
                    const pdfApp = iframe.contentWindow.PDFViewerApplication;
                    if (pdfApp && pdfApp.page) {
                        const instance = this.instances[containerId];
                        if (instance && instance.currentPage !== pdfApp.page) {
                            instance.currentPage = pdfApp.page;
                        }
                    }
                } catch (e) {
                    // Игнорируем ошибки cross-origin
                }
            },

            getCurrentPage: function(containerId) {
                const instance = this.instances[containerId];
                return instance ? instance.currentPage : 1;
            },

            addBookmark: function(containerId) {
                const instance = this.instances[containerId];
                if (!instance) {
                    console.error('Instance not found for:', containerId);
                    alert('Закладки не инициализированы. Подождите немного.');
                    return;
                }

                const page = this.getCurrentPage(containerId);
                const name = prompt('Введите название закладки для страницы ' + page + ':', 'Страница ' + page);

                if (name) {
                    const bookmark = {
                        id: 'b_' + Date.now(),
                        name: name,
                        page: page,
                        timestamp: Date.now(),
                        date: new Date().toLocaleString('ru-RU')
                    };

                    this.saveBookmark(containerId, bookmark);
                    this.renderBookmarks(containerId);
                }
            },

            saveBookmark: function(containerId, bookmark) {
                const instance = this.instances[containerId];
                if (!instance) return;

                const storageKey = this.getStorageKey(containerId);
                let bookmarks = JSON.parse(localStorage.getItem(storageKey)) || [];

                bookmarks = bookmarks.filter(b => b.page !== bookmark.page);
                bookmarks.push(bookmark);
                bookmarks.sort((a, b) => a.page - b.page);

                localStorage.setItem(storageKey, JSON.stringify(bookmarks));
                instance.bookmarks = bookmarks;
            },

            loadBookmarks: function(containerId) {
                const instance = this.instances[containerId];
                if (!instance) return;

                const storageKey = this.getStorageKey(containerId);
                instance.bookmarks = JSON.parse(localStorage.getItem(storageKey)) || [];
                this.renderBookmarks(containerId);
            },

            renderBookmarks: function(containerId) {
                const instance = this.instances[containerId];
                const list = document.getElementById(containerId + '-bookmarks-list');

                if (!list || !instance) return;

                if (instance.bookmarks.length === 0) {
                    list.innerHTML = '<div class="no-bookmarks">Закладок пока нет</div>';
                    return;
                }
                let html = '';
                for (let i = 0; i < instance.bookmarks.length; i++) {
                    const bookmark = instance.bookmarks[i];
                    html += '<div class="bookmark-item" data-page="' + bookmark.page + '">';
                    html += '<div class="bookmark-info" onclick="pdfJsBookmarks.goToPage(\'' + containerId + '\', ' + bookmark.page + ')">';
                    html += '<div class="bookmark-name">' + this.escapeHtml(bookmark.name) + '</div>';
                    html += '<div class="bookmark-meta">';
                    html += '<span class="bookmark-date">' + this.escapeHtml(bookmark.date) + '</span>';
                    html += '</div></div>';
                    html += '<div class="bookmark-actions">';
                    html += '<button class="btn-delete" onclick="pdfJsBookmarks.deleteBookmark(\'' + containerId + '\', \'' + bookmark.id + '\')" title="Удалить">❌</button>';
                    html += '</div></div>';
                }
                list.innerHTML = html;
            },

            escapeHtml: function(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            },

            goToPage: function(containerId, page) {
                const iframe = document.getElementById('pdfjs-' + containerId);
                if (iframe && iframe.contentWindow) {
                    try {
                        const pdfApp = iframe.contentWindow.PDFViewerApplication;
                        if (pdfApp) {
                            pdfApp.page = page;
                        }
                    } catch (e) {
                        console.error('Error navigating to page:', e);
                    }
                }
            },

            deleteBookmark: function(containerId, bookmarkId) {
                if (!confirm('Удалить закладку?')) return;

                const instance = this.instances[containerId];
                if (!instance) return;

                const storageKey = this.getStorageKey(containerId);
                instance.bookmarks = instance.bookmarks.filter(b => b.id !== bookmarkId);
                localStorage.setItem(storageKey, JSON.stringify(instance.bookmarks));
                this.renderBookmarks(containerId);
            },

            clearBookmarks: function(containerId) {
                if (!confirm('Удалить все закладки?')) return;

                const instance = this.instances[containerId];
                if (!instance) return;

                const storageKey = this.getStorageKey(containerId);
                instance.bookmarks = [];
                localStorage.removeItem(storageKey);
                this.renderBookmarks(containerId);
            },

            togglePanel: function(containerId) {
                const panel = document.getElementById(containerId + '-bookmarks-panel');
                const toggleBtn = document.querySelector('.bookmarks-panel-toggle');
                const icon = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;

                if (panel && toggleBtn && icon) {
                    const isHidden = panel.classList.toggle('hidden');

                    // Меняем иконку
                    if (isHidden) {
                        icon.classList.remove('fa-angle-left');
                        icon.classList.add('fa-angle-right');
                        toggleBtn.classList.add('collapsed');
                    } else {
                        icon.classList.remove('fa-angle-right');
                        icon.classList.add('fa-angle-left');
                        toggleBtn.classList.remove('collapsed');
                    }

                    // Сохраняем состояние
                    this.savePanelState(containerId, isHidden);
                }
            },

            savePanelState: function(containerId, isHidden) {
                const storageKey = this.getStorageKey(containerId) + '_panelState';
                localStorage.setItem(storageKey, JSON.stringify(isHidden));
            },

            loadPanelState: function(containerId) {
                const storageKey = this.getStorageKey(containerId) + '_panelState';
                const savedState = localStorage.getItem(storageKey);
                return savedState ? JSON.parse(savedState) : false;
            },

            applySavedPanelState: function(containerId) {
                const isHidden = this.loadPanelState(containerId);
                const panel = document.getElementById(containerId + '-bookmarks-panel');
                const toggleBtn = document.querySelector('.bookmarks-panel-toggle');
                const icon = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;

                if (panel && toggleBtn && icon) {
                    if (isHidden) {
                        panel.classList.add('hidden');
                        icon.classList.remove('fa-angle-left');
                        icon.classList.add('fa-angle-right');
                        toggleBtn.classList.add('collapsed');
                    } else {
                        panel.classList.remove('hidden');
                        icon.classList.remove('fa-angle-right');
                        icon.classList.add('fa-angle-left');
                        toggleBtn.classList.remove('collapsed');
                    }
                }
            },

            getStorageKey: function(containerId) {
                const instance = this.instances[containerId];
                if (!instance) {
                    return 'pdfjs_bookmarks_default_' + containerId;
                }

                const pdfUrl = instance.config?.pdfUrl || window.location.href;

                // Создаем уникальную сигнатуру книги
                const bookSignature = this.createBookSignature(pdfUrl, containerId);

                return 'pdfjs_bookmarks_' + bookSignature;
            },

            createBookSignature: function(pdfUrl, containerId) {
                // Пытаемся извлечь полезную информацию из URL
                let signature = '';

                try {
                    const urlObj = new URL(pdfUrl);
                    const fileName = urlObj.pathname.split('/').pop() || '';
                    const fileExt = fileName.split('.').pop() || '';
                    const baseName = fileName.replace('.' + fileExt, '');

                    // Создаем сигнатуру на основе имени файла, расширения и containerId
                    signature = baseName + '_' + fileExt + '_' + containerId;

                } catch (e) {
                    // Fallback: используем хэш всего URL + containerId
                    signature = this.stringToHash(pdfUrl + '_' + containerId);
                }

                // Дополнительно хэшируем для безопасности
                return this.stringToHash(signature);
            },

            stringToHash: function(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return 'book_' + Math.abs(hash).toString(36);
            },

            generateBookId: function(pdfUrl, containerId) {
                // Генерируем ID на основе URL и containerId
                let hash = 0;
                const str = pdfUrl + '_' + containerId;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash).toString(36);
            },

            destroy: function(containerId) {
                const instance = this.instances[containerId];
                if (instance && instance.checkInterval) {
                    clearInterval(instance.checkInterval);
                }
                delete this.instances[containerId];
            }
        };
    }
})();