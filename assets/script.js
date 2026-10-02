/**
 * DelStudHub - Main Script
 * Mencakup fitur Expense Tracker, Bookmark Manager, dan Quiz App.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. INTEGRASI TAB & STATE
    // ==========================================
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Ambil tab terakhir dari URL Parameter, lalu localStorage, atau default
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    let activeTabId = 'tab-expense';
    
    if (tabParam && document.getElementById(`tab-${tabParam}`)) {
        activeTabId = `tab-${tabParam}`;
    } else {
        activeTabId = localStorage.getItem('pabwe_active_tab') || 'tab-expense';
    }
    
    function activateTab(targetId) {
        // Update Buttons
        navTabs.forEach(tab => {
            if (tab.dataset.target === targetId) {
                tab.classList.add('text-primary', 'bg-indigo-50');
                tab.classList.remove('text-gray-700', 'hover:bg-gray-100');
                tab.setAttribute('aria-selected', 'true');
            } else {
                tab.classList.remove('text-primary', 'bg-indigo-50');
                tab.classList.add('text-gray-700', 'hover:bg-gray-100');
                tab.setAttribute('aria-selected', 'false');
            }
        });
        
        // Update Contents
        tabContents.forEach(content => {
            if (content.id === targetId) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // Simpan ke localStorage
        localStorage.setItem('pabwe_active_tab', targetId);
        
        // Update URL Query Param (tanpa me-refresh halaman)
        const tabName = targetId.replace('tab-', '');
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('tab', tabName);
        window.history.replaceState(null, '', newUrl);
    }
    
    // Inisialisasi tab aktif
    activateTab(activeTabId);
    
    // Event listener untuk klik tab
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            activateTab(e.currentTarget.dataset.target);
        });
    });


    // ==========================================
    // 2. UTILITAS MODAL
    // ==========================================
    let itemToDelete = null; // Menyimpan info item yang akan dihapus
    let deleteCallback = null; // Fungsi yang dipanggil saat hapus dikonfirmasi

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        const content = document.getElementById(`${modalId}-content`);
        modal.classList.remove('hidden');
        // Trigger reflow
        void modal.offsetWidth; 
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        const content = document.getElementById(`${modalId}-content`);
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300); // Sesuai dengan durasi transisi
    }

    // Pasang event listener ke semua tombol close modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.fixed.inset-0');
            if (modal) closeModal(modal.id);
        });
    });


    // ==========================================
    // 3. CATATAN PENGELUARAN (EXPENSE TRACKER)
    // ==========================================
    
    const EXPENSE_STORAGE_KEY = 'pabwe_expense_data';
    let expenses = JSON.parse(localStorage.getItem(EXPENSE_STORAGE_KEY)) || [];
    
    // DOM Elements
    const expenseList = document.getElementById('expense-list');
    const expenseEmpty = document.getElementById('expense-empty');
    const formExpense = document.getElementById('form-expense');
    
    const inputExpenseId = document.getElementById('expense-id');
    const inputExpenseTitle = document.getElementById('expense-title');
    const inputExpenseType = document.getElementById('expense-type');
    const inputExpenseCategory = document.getElementById('expense-category');
    const inputExpenseAmount = document.getElementById('expense-amount');
    const inputExpenseDate = document.getElementById('expense-date');
    
    const filterExpenseSearch = document.getElementById('filter-expense-search');
    const filterExpenseType = document.getElementById('filter-expense-type');

    // Format Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
    };

    function saveExpenses() {
        localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
        renderExpenses();
    }

    function renderExpenses() {
        // Terapkan Filter
        const searchTerm = filterExpenseSearch.value.toLowerCase();
        const typeFilter = filterExpenseType.value;
        
        const filteredExpenses = expenses.filter(exp => {
            const matchSearch = exp.title.toLowerCase().includes(searchTerm) || exp.category.toLowerCase().includes(searchTerm);
            const matchType = typeFilter === 'all' || exp.type === typeFilter;
            return matchSearch && matchType;
        });

        // Urutkan dari yang terbaru (berdasarkan tanggal, lalu ID)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render List
        expenseList.innerHTML = '';
        
        if (filteredExpenses.length === 0) {
            expenseList.classList.add('hidden');
            expenseEmpty.classList.remove('hidden');
        } else {
            expenseList.classList.remove('hidden');
            expenseEmpty.classList.add('hidden');
            
            filteredExpenses.forEach(exp => {
                const li = document.createElement('li');
                li.className = 'p-4 sm:p-5 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4';
                
                const isIncome = exp.type === 'Pemasukan';
                const typeColorClass = isIncome ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100';
                const typeIcon = isIncome ? 'ti-trending-up' : 'ti-trending-down';

                li.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg border ${typeColorClass}" aria-hidden="true">
                            <i class="ti ${typeIcon}"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900">${exp.title}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">${exp.category}</span>
                                <span class="text-xs text-gray-600"><i class="ti ti-calendar text-gray-500" aria-hidden="true"></i> ${exp.date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between w-full sm:w-auto gap-4">
                        <span class="font-bold ${isIncome ? 'text-emerald-700' : 'text-gray-900'}">${isIncome ? '+' : '-'}${formatRupiah(exp.amount)}</span>
                        <div class="flex gap-2">
                            <button onclick="editExpense('${exp.id}')" aria-label="Ubah transaksi ${exp.title}" class="p-2 text-gray-600 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors" title="Ubah">
                                <i class="ti ti-edit" aria-hidden="true"></i>
                            </button>
                            <button onclick="confirmDeleteExpense('${exp.id}')" aria-label="Hapus transaksi ${exp.title}" class="p-2 text-gray-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                <i class="ti ti-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                `;
                expenseList.appendChild(li);
            });
        }

        // Kalkulasi Ringkasan
        let totalIncome = 0;
        let totalExpense = 0;
        
        expenses.forEach(exp => {
            if (exp.type === 'Pemasukan') totalIncome += exp.amount;
            else totalExpense += exp.amount;
        });
        
        document.getElementById('summary-income').textContent = formatRupiah(totalIncome);
        document.getElementById('summary-expense').textContent = formatRupiah(totalExpense);
        document.getElementById('summary-balance').textContent = formatRupiah(totalIncome - totalExpense);
    }

    // Modal Add Expense
    document.getElementById('btn-add-expense').addEventListener('click', () => {
        document.getElementById('modal-expense-title').textContent = 'Tambah Transaksi';
        formExpense.reset();
        inputExpenseId.value = '';
        inputExpenseDate.valueAsDate = new Date(); // Default hari ini
        openModal('modal-expense');
    });

    // Form Submit
    formExpense.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = inputExpenseId.value || Date.now().toString();
        const title = inputExpenseTitle.value.trim();
        const type = inputExpenseType.value;
        const category = inputExpenseCategory.value.trim();
        const amount = parseFloat(inputExpenseAmount.value);
        const date = inputExpenseDate.value;
        
        // Validasi tambahan
        if(amount <= 0) {
            alert('Jumlah harus lebih dari 0');
            return;
        }

        const expenseData = { id, title, type, category, amount, date };

        if (inputExpenseId.value) {
            // Update
            const index = expenses.findIndex(exp => exp.id === id);
            if (index !== -1) expenses[index] = expenseData;
        } else {
            // Tambah baru
            expenses.push(expenseData);
        }

        saveExpenses();
        closeModal('modal-expense');
    });

    // Ekspos fungsi ke global untuk onclick
    window.editExpense = (id) => {
        const exp = expenses.find(e => e.id === id);
        if (exp) {
            document.getElementById('modal-expense-title').textContent = 'Ubah Transaksi';
            inputExpenseId.value = exp.id;
            inputExpenseTitle.value = exp.title;
            inputExpenseType.value = exp.type;
            inputExpenseCategory.value = exp.category;
            inputExpenseAmount.value = exp.amount;
            inputExpenseDate.value = exp.date;
            openModal('modal-expense');
        }
    };

    window.confirmDeleteExpense = (id) => {
        itemToDelete = id;
        deleteCallback = () => {
            expenses = expenses.filter(e => e.id !== itemToDelete);
            saveExpenses();
            closeModal('modal-confirm');
        };
        openModal('modal-confirm');
    };

    // Filter Listeners
    filterExpenseSearch.addEventListener('input', renderExpenses);
    filterExpenseType.addEventListener('change', renderExpenses);

    // Initial render
    renderExpenses();


    // ==========================================
    // 4. BOOKMARK / LINK MANAGER
    // ==========================================
    
    const BOOKMARK_STORAGE_KEY = 'pabwe_bookmark_data';
    let bookmarks = JSON.parse(localStorage.getItem(BOOKMARK_STORAGE_KEY)) || [];
    
    // DOM Elements
    const bookmarkList = document.getElementById('bookmark-list');
    const bookmarkEmpty = document.getElementById('bookmark-empty');
    const formBookmark = document.getElementById('form-bookmark');
    
    const inputBookmarkId = document.getElementById('bookmark-id');
    const inputBookmarkTitle = document.getElementById('bookmark-title');
    const inputBookmarkUrl = document.getElementById('bookmark-url');
    const inputBookmarkCategory = document.getElementById('bookmark-category');
    const inputBookmarkNote = document.getElementById('bookmark-note');
    const urlErrorMsg = document.getElementById('bookmark-url-error');
    
    const filterBookmarkSearch = document.getElementById('filter-bookmark-search');
    const sortBookmark = document.getElementById('sort-bookmark');

    function saveBookmarks() {
        localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
        renderBookmarks();
    }

    function renderBookmarks() {
        // Terapkan Pencarian
        const searchTerm = filterBookmarkSearch.value.toLowerCase();
        let filteredBookmarks = bookmarks.filter(bm => 
            bm.title.toLowerCase().includes(searchTerm) || 
            bm.url.toLowerCase().includes(searchTerm) || 
            bm.category.toLowerCase().includes(searchTerm)
        );

        // Terapkan Sorting
        const sortMode = sortBookmark.value;
        filteredBookmarks.sort((a, b) => {
            if (sortMode === 'az') return a.title.localeCompare(b.title);
            if (sortMode === 'za') return b.title.localeCompare(a.title);
            // newest (default by id/timestamp)
            return b.id - a.id; 
        });

        // Render Cards
        bookmarkList.innerHTML = '';
        
        if (filteredBookmarks.length === 0) {
            bookmarkList.classList.add('hidden');
            bookmarkEmpty.classList.remove('hidden');
            bookmarkEmpty.classList.add('flex');
        } else {
            bookmarkList.classList.remove('hidden');
            bookmarkEmpty.classList.add('hidden');
            bookmarkEmpty.classList.remove('flex');
            
            filteredBookmarks.forEach(bm => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all p-5 flex flex-col group';
                
                // Ekstrak domain untuk visual
                let domain = '';
                try { domain = new URL(bm.url).hostname.replace('www.', ''); } catch(e) { domain = bm.url; }

                card.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            <i class="ti ti-tag" aria-hidden="true"></i> ${bm.category}
                        </span>
                        <div class="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onclick="editBookmark('${bm.id}')" aria-label="Ubah bookmark ${bm.title}" class="p-1.5 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-md transition-colors" title="Ubah">
                                <i class="ti ti-edit" aria-hidden="true"></i>
                            </button>
                            <button onclick="confirmDeleteBookmark('${bm.id}')" aria-label="Hapus bookmark ${bm.title}" class="p-1.5 text-gray-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-md transition-colors" title="Hapus">
                                <i class="ti ti-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <h3 class="font-bold text-gray-900 text-lg mb-1 line-clamp-1" title="${bm.title}">${bm.title}</h3>
                    <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline flex items-center gap-1 mb-3 line-clamp-1" title="Buka tautan ${bm.url}">
                        <i class="ti ti-link text-xs" aria-hidden="true"></i> ${domain}
                    </a>
                    ${bm.note ? `<p class="text-gray-600 text-sm mt-auto border-t border-gray-100 pt-3 line-clamp-2">${bm.note}</p>` : '<div class="mt-auto"></div>'}
                `;
                bookmarkList.appendChild(card);
            });
        }
    }

    // Modal Add Bookmark
    document.getElementById('btn-add-bookmark').addEventListener('click', () => {
        document.getElementById('modal-bookmark-title').textContent = 'Tambah Bookmark';
        formBookmark.reset();
        inputBookmarkId.value = '';
        urlErrorMsg.classList.add('hidden');
        openModal('modal-bookmark');
    });

    // Validasi URL Sederhana saat mengetik
    inputBookmarkUrl.addEventListener('input', (e) => {
        const url = e.target.value;
        if (url && !/^https?:\/\//i.test(url)) {
            urlErrorMsg.classList.remove('hidden');
        } else {
            urlErrorMsg.classList.add('hidden');
        }
    });

    // Form Submit
    formBookmark.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const url = inputBookmarkUrl.value.trim();
        // Validasi wajib (Minimal diawali http:// atau https://)
        if (!/^https?:\/\//i.test(url)) {
            urlErrorMsg.classList.remove('hidden');
            return;
        }

        const id = inputBookmarkId.value || Date.now().toString();
        const title = inputBookmarkTitle.value.trim();
        const category = inputBookmarkCategory.value.trim();
        const note = inputBookmarkNote.value.trim();

        const bookmarkData = { id, title, url, category, note };

        if (inputBookmarkId.value) {
            const index = bookmarks.findIndex(bm => bm.id === id);
            if (index !== -1) bookmarks[index] = bookmarkData;
        } else {
            bookmarks.push(bookmarkData);
        }

        saveBookmarks();
        closeModal('modal-bookmark');
    });

    window.editBookmark = (id) => {
        const bm = bookmarks.find(b => b.id === id);
        if (bm) {
            document.getElementById('modal-bookmark-title').textContent = 'Ubah Bookmark';
            inputBookmarkId.value = bm.id;
            inputBookmarkTitle.value = bm.title;
            inputBookmarkUrl.value = bm.url;
            inputBookmarkCategory.value = bm.category;
            inputBookmarkNote.value = bm.note;
            urlErrorMsg.classList.add('hidden');
            openModal('modal-bookmark');
        }
    };

    window.confirmDeleteBookmark = (id) => {
        itemToDelete = id;
        deleteCallback = () => {
            bookmarks = bookmarks.filter(b => b.id !== itemToDelete);
            saveBookmarks();
            closeModal('modal-confirm');
        };
        openModal('modal-confirm');
    };

    // Filter & Sort Listeners
    filterBookmarkSearch.addEventListener('input', renderBookmarks);
    sortBookmark.addEventListener('change', renderBookmarks);

    // Initial render
    renderBookmarks();


    // ==========================================
    // 5. GLOBAL CONFIRM DELETE MODAL
    // ==========================================
    document.getElementById('btn-confirm-delete').addEventListener('click', () => {
        if (typeof deleteCallback === 'function') {
            deleteCallback();
            deleteCallback = null;
            itemToDelete = null;
        }
    });


    // ==========================================
    // 6. KUIS INTERAKTIF (QUIZ APP)
    // ==========================================
    
    // Data Soal (Array of Object)
    const quizData = [
        {
            question: "Manakah tag HTML yang digunakan untuk membuat tautan (hyperlink)?",
            options: ["&lt;link&gt;", "&lt;a&gt;", "&lt;href&gt;", "&lt;hyper&gt;"],
            correct: 1
        },
        {
            question: "Properti CSS apa yang digunakan untuk mengubah warna latar belakang?",
            options: ["color", "bg-color", "background-color", "bgColor"],
            correct: 2
        },
        {
            question: "Tipe data apa yang digunakan untuk menyimpan nilai benar atau salah di JavaScript?",
            options: ["String", "Number", "Boolean", "Array"],
            correct: 2
        },
        {
            question: "Apa singkatan dari DOM?",
            options: [
                "Document Object Model",
                "Data Object Module",
                "Display Orienting Method",
                "Document Orientation Model"
            ],
            correct: 0
        },
        {
            question: "Bagaimana cara mendeklarasikan fungsi di JavaScript?",
            options: [
                "function = myFunction()",
                "def myFunction()",
                "void myFunction()",
                "function myFunction()"
            ],
            correct: 3
        }
    ];

    const QUIZ_STORAGE_KEY = 'pabwe_quiz_highscore';
    let highScore = parseInt(localStorage.getItem(QUIZ_STORAGE_KEY)) || 0;
    
    // Quiz State
    let currentQuestionIndex = 0;
    let currentScore = 0;
    let selectedOptionIndex = null;

    // DOM Elements
    const highScoreDisplay = document.getElementById('quiz-high-score');
    
    const screenStart = document.getElementById('quiz-start-screen');
    const screenActive = document.getElementById('quiz-active-screen');
    const screenResult = document.getElementById('quiz-result-screen');
    
    const qProgressText = document.getElementById('quiz-progress-text');
    const qProgressBar = document.getElementById('quiz-progress-bar');
    const qQuestionText = document.getElementById('quiz-question');
    const qOptionsContainer = document.getElementById('quiz-options');
    const btnNext = document.getElementById('btn-next-question');
    
    // Update High Score Display
    highScoreDisplay.textContent = highScore;

    function resetQuiz() {
        currentQuestionIndex = 0;
        currentScore = 0;
        selectedOptionIndex = null;
        screenResult.classList.add('hidden');
        screenResult.classList.remove('flex');
        screenActive.classList.remove('hidden');
        screenActive.classList.add('flex');
        renderQuestion();
    }

    function renderQuestion() {
        const q = quizData[currentQuestionIndex];
        
        // Update Progress
        const qNum = currentQuestionIndex + 1;
        const progressPercent = Math.round((qNum / quizData.length) * 100);
        qProgressText.textContent = `Soal ${qNum} / ${quizData.length}`;
        qProgressBar.style.width = `${progressPercent}%`;
        qProgressBar.parentElement.setAttribute('aria-valuenow', progressPercent);
        
        // Render Question
        qQuestionText.textContent = q.question; // textContent safer for XSS
        
        // Render Options
        qOptionsContainer.innerHTML = '';
        btnNext.classList.add('hidden');
        selectedOptionIndex = null;

        q.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            const letter = String.fromCharCode(65 + index);
            btn.className = 'w-full text-left p-4 rounded-xl border-2 border-gray-100 hover:border-primary hover:bg-indigo-50 font-medium text-gray-700 transition-all quiz-option';
            btn.setAttribute('aria-label', `Pilihan ${letter}: ${opt}`);
            btn.innerHTML = `<span class="inline-block w-6 h-6 rounded-full bg-gray-100 text-center text-sm leading-6 mr-3 text-gray-700 font-bold" aria-hidden="true">${letter}</span> ${opt}`;
            
            btn.addEventListener('click', () => {
                // Hapus state aktif dari semua opsi
                document.querySelectorAll('.quiz-option').forEach(el => {
                    el.classList.remove('border-primary', 'bg-indigo-50', 'ring-2', 'ring-primary', 'ring-opacity-50');
                    el.classList.add('border-gray-100');
                    el.setAttribute('aria-pressed', 'false');
                });
                // Set aktif
                btn.classList.add('border-primary', 'bg-indigo-50', 'ring-2', 'ring-primary', 'ring-opacity-50');
                btn.classList.remove('border-gray-100');
                btn.setAttribute('aria-pressed', 'true');
                
                selectedOptionIndex = index;
                btnNext.classList.remove('hidden'); // Tampilkan tombol Next
            });
            
            qOptionsContainer.appendChild(btn);
        });
    }

    function checkAnswerAndNext() {
        if (selectedOptionIndex === null) return;
        
        // Cek jawaban
        if (selectedOptionIndex === quizData[currentQuestionIndex].correct) {
            currentScore++;
        }
        
        // Lanjut atau Selesai
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.length) {
            renderQuestion();
        } else {
            showResult();
        }
    }

    function showResult() {
        screenActive.classList.add('hidden');
        screenActive.classList.remove('flex');
        screenResult.classList.remove('hidden');
        screenResult.classList.add('flex');
        
        document.getElementById('quiz-final-score').textContent = `${currentScore} / ${quizData.length}`;
        
        const newHighMsg = document.getElementById('quiz-new-highscore-msg');
        
        // Update High Score
        if (currentScore > highScore) {
            highScore = currentScore;
            localStorage.setItem(QUIZ_STORAGE_KEY, highScore);
            highScoreDisplay.textContent = highScore;
            newHighMsg.classList.remove('hidden');
        } else {
            newHighMsg.classList.add('hidden');
        }
    }

    // Event Listeners Quiz
    document.getElementById('btn-start-quiz').addEventListener('click', () => {
        screenStart.classList.add('hidden');
        resetQuiz();
    });

    btnNext.addEventListener('click', checkAnswerAndNext);
    
    document.getElementById('btn-retry-quiz').addEventListener('click', () => {
        resetQuiz();
    });

});
