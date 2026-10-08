
/* =========================================================
   WILDFIRE VAULT
   Expense Tracker — JavaScript Engine
   ========================================================= */


/* =========================================================
   1. DATA STORAGE
   ========================================================= */

const STORAGE_KEY = "wildfireVaultData";


const defaultData = {
    transactions: [],
    budget: 0,

    goal: {
        name: "",
        target: 0,
        saved: 0
    }
};


let appData = loadData();


function loadData() {

    try {

        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            return structuredClone(defaultData);
        }

        const parsed = JSON.parse(saved);

        return {
            ...defaultData,
            ...parsed,

            goal: {
                ...defaultData.goal,
                ...(parsed.goal || {})
            }
        };

    } catch (error) {

        console.error("Could not load WILDFIRE VAULT data:", error);

        return structuredClone(defaultData);
    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(appData)
    );
}


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const savingsRate = document.getElementById("savingsRate");
const savingsProgress = document.getElementById("savingsProgress");

const budgetPercentage =
    document.getElementById("budgetPercentage");

const budgetSpent =
    document.getElementById("budgetSpent");

const budgetLimit =
    document.getElementById("budgetLimit");

const budgetProgress =
    document.getElementById("budgetProgress");

const budgetMessage =
    document.getElementById("budgetMessage");

const recentTransactions =
    document.getElementById("recentTransactions");

const allTransactions =
    document.getElementById("allTransactions");

const goalName =
    document.getElementById("goalName");

const goalSaved =
    document.getElementById("goalSaved");

const goalTarget =
    document.getElementById("goalTarget");

const goalProgress =
    document.getElementById("goalProgress");

const goalPercentage =
    document.getElementById("goalPercentage");

const goalRemaining =
    document.getElementById("goalRemaining");

const toast =
    document.getElementById("toast");

const toastTitle =
    document.getElementById("toastTitle");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   3. FORMATTERS
   ========================================================= */

function formatMoney(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}


function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function getToday() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   4. CALCULATIONS
   ========================================================= */

function getTotals() {

    let income = 0;
    let expense = 0;

    appData.transactions.forEach(transaction => {

        const amount = Number(transaction.amount) || 0;

        if (transaction.type === "income") {

            income += amount;

        } else {

            expense += amount;
        }

    });

    return {
        income,
        expense,
        balance: income - expense
    };
}


function getCurrentMonthExpenses() {

    const now = new Date();

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return appData.transactions
        .filter(transaction => {

            if (transaction.type !== "expense") {
                return false;
            }

            const date =
                new Date(transaction.date + "T00:00:00");

            return (
                date.getFullYear() === currentYear &&
                date.getMonth() === currentMonth
            );

        })
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );
}


/* =========================================================
   5. DASHBOARD UPDATE
   ========================================================= */

function updateDashboard() {

    const totals = getTotals();

    /* Balance */

    totalBalance.textContent =
        formatMoney(totals.balance);


    /* Income */

    totalIncome.textContent =
        formatMoney(totals.income);


    /* Expenses */

    totalExpense.textContent =
        formatMoney(totals.expense);


    /* Savings rate */

    let rate = 0;

    if (totals.income > 0) {

        rate =
            ((totals.income - totals.expense) /
                totals.income) * 100;

        rate = Math.max(0, Math.min(100, rate));
    }

    savingsRate.textContent =
        `${Math.round(rate)}%`;

    savingsProgress.style.width =
        `${rate}%`;


    /* Balance change */

    const balanceChange =
        document.getElementById("balanceChange");

    if (balanceChange) {

        balanceChange.innerHTML = `
            <i class="fa-solid fa-arrow-up"></i>
            ${formatMoney(totals.balance)} total
        `;

        balanceChange.classList.toggle(
            "positive",
            totals.balance >= 0
        );
    }


    updateBudget();

    updateGoal();

    renderRecentTransactions();

    renderAllTransactions();

    updateChart();
}


/* =========================================================
   6. BUDGET
   ========================================================= */

function updateBudget() {

    const spent =
        getCurrentMonthExpenses();

    const budget =
        Number(appData.budget) || 0;


    budgetSpent.textContent =
        formatMoney(spent);

    budgetLimit.textContent =
        formatMoney(budget);


    if (budget <= 0) {

        budgetPercentage.textContent = "0%";

        budgetProgress.style.width = "0%";

        budgetMessage.textContent =
            "Set a monthly budget to start tracking.";

        updateBudgetCircle(0);

        return;
    }


    let percentage =
        (spent / budget) * 100;

    const displayPercentage =
        Math.min(100, Math.round(percentage));


    budgetPercentage.textContent =
        `${displayPercentage}%`;


    budgetProgress.style.width =
        `${Math.min(100, percentage)}%`;


    updateBudgetCircle(
        Math.min(100, percentage)
    );


    if (percentage < 70) {

        budgetMessage.textContent =
            `${formatMoney(budget - spent)} left this month.`;

    } else if (percentage < 100) {

        budgetMessage.textContent =
            "You're getting close to your monthly limit.";

    } else {

        budgetMessage.textContent =
            "Budget exceeded. Keep an eye on spending.";
    }
}


function updateBudgetCircle(percentage) {

    const degrees =
        percentage * 3.6;

    const circle =
        document.querySelector(".budget-circle");

    if (!circle) {
        return;
    }

    circle.style.background = `
        conic-gradient(
            white ${degrees}deg,
            rgba(255,255,255,0.08) ${degrees}deg
        )
    `;
}


/* =========================================================
   7. SAVINGS GOAL
   ========================================================= */

function updateGoal() {

    const goal = appData.goal;


    if (!goal.name || !goal.target) {

        goalName.textContent =
            "Create your first goal";

        goalSaved.textContent =
            "₹0";

        goalTarget.textContent =
            "/ ₹0";

        goalProgress.style.width =
            "0%";

        goalPercentage.textContent =
            "0% complete";

        goalRemaining.textContent =
            "₹0 remaining";

        return;
    }


    const target =
        Number(goal.target);

    const saved =
        Number(goal.saved);


    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (saved / target) * 100
            )
        );


    const remaining =
        Math.max(
            0,
            target - saved
        );


    goalName.textContent =
        goal.name;

    goalSaved.textContent =
        formatMoney(saved);

    goalTarget.textContent =
        `/ ${formatMoney(target)}`;

    goalProgress.style.width =
        `${percentage}%`;

    goalPercentage.textContent =
        `${Math.round(percentage)}% complete`;

    goalRemaining.textContent =
        `${formatMoney(remaining)} remaining`;
}


/* =========================================================
   8. TRANSACTION ICONS
   ========================================================= */

function getCategoryIcon(category) {

    const icons = {

        Food: "fa-utensils",

        Travel: "fa-car",

        Shopping: "fa-bag-shopping",

        Education: "fa-book-open",

        Bills: "fa-lightbulb",

        Entertainment: "fa-gamepad",

        Salary: "fa-briefcase",

        Freelance: "fa-laptop",

        Other: "fa-box"
    };


    return icons[category] || "fa-receipt";
}


/* =========================================================
   9. RECENT TRANSACTIONS
   ========================================================= */

function renderRecentTransactions() {

    if (!appData.transactions.length) {

        recentTransactions.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>

                <h4>No transactions yet</h4>

                <p>
                    Add your first income or expense
                    to start building your vault.
                </p>

            </div>
        `;

        return;
    }


    const sorted =
        [...appData.transactions]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    recentTransactions.innerHTML =
        sorted.map(transaction => {

            const isIncome =
                transaction.type === "income";


            return `
                <div class="transaction-item">

                    <div class="transaction-icon">
                        <i class="fa-solid ${getCategoryIcon(
                            transaction.category
                        )}"></i>
                    </div>

                    <div class="transaction-info">

                        <strong>
                            ${escapeHTML(transaction.title)}
                        </strong>

                        <span>
                            ${transaction.category}
                            •
                            ${formatDate(transaction.date)}
                        </span>

                    </div>

                    <div class="transaction-amount ${
                        isIncome
                            ? "income"
                            : "expense"
                    }">

                        ${isIncome ? "+" : "-"}
                        ${formatMoney(transaction.amount)}

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   10. ALL TRANSACTIONS
   ========================================================= */

function renderAllTransactions(
    searchTerm = "",
    filter = "all"
) {

    let transactions =
        [...appData.transactions];


    /* Filter */

    if (filter !== "all") {

        transactions =
            transactions.filter(
                transaction =>
                    transaction.type === filter
            );
    }


    /* Search */

    if (searchTerm.trim()) {

        const search =
            searchTerm
                .toLowerCase()
                .trim();

        transactions =
            transactions.filter(transaction =>
                transaction.title
                    .toLowerCase()
                    .includes(search)
                ||
                transaction.category
                    .toLowerCase()
                    .includes(search)
            );
    }


    /* Sort */

    transactions.sort(
        (a, b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    if (!transactions.length) {

        allTransactions.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>

                <h4>No transactions found</h4>

                <p>
                    Try another search or add a new transaction.
                </p>

            </div>
        `;

        return;
    }


    allTransactions.innerHTML =
        transactions.map(transaction => {

            const isIncome =
                transaction.type === "income";


            return `
                <div class="history-item">

                    <div class="transaction-icon">
                        <i class="fa-solid ${getCategoryIcon(
                            transaction.category
                        )}"></i>
                    </div>

                    <div class="transaction-info">

                        <strong>
                            ${escapeHTML(transaction.title)}
                        </strong>

                        <span>
                            ${transaction.category}
                            •
                            ${formatDate(transaction.date)}
                            ${
                                transaction.note
                                    ? ` • ${escapeHTML(
                                        transaction.note
                                    )}`
                                    : ""
                            }
                        </span>

                    </div>

                    <div class="transaction-amount ${
                        isIncome
                            ? "income"
                            : "expense"
                    }">

                        ${isIncome ? "+" : "-"}
                        ${formatMoney(transaction.amount)}

                    </div>

                    <button
                        class="history-delete"
                        onclick="deleteTransaction('${transaction.id}')"
                        title="Delete transaction">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>
            `;

        }).join("");
}


/* =========================================================
   11. ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   12. TRANSACTION MODAL
   ========================================================= */

const transactionModal =
    document.getElementById("transactionModal");

const openTransactionModal =
    document.getElementById("openTransactionModal");

const openTransactionModal2 =
    document.getElementById("openTransactionModal2");

const closeTransactionModal =
    document.getElementById("closeTransactionModal");


function openTransaction() {

    transactionModal.classList.add("active");

    document.getElementById(
        "transactionDate"
    ).value = getToday();

    setTimeout(() => {

        document.getElementById(
            "transactionTitle"
        ).focus();

    }, 100);
}


function closeTransaction() {

    transactionModal.classList.remove("active");
}


openTransactionModal.addEventListener(
    "click",
    openTransaction
);


openTransactionModal2.addEventListener(
    "click",
    openTransaction
);


closeTransactionModal.addEventListener(
    "click",
    closeTransaction
);


/* =========================================================
   13. TRANSACTION TYPE
   ========================================================= */

const typeButtons =
    document.querySelectorAll(".type-button");

const transactionType =
    document.getElementById("transactionType");


typeButtons.forEach(button => {

    button.addEventListener("click", () => {

        typeButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        transactionType.value =
            button.dataset.type;
    });

});


/* =========================================================
   14. ADD TRANSACTION
   ========================================================= */

const transactionForm =
    document.getElementById("transactionForm");


transactionForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const title =
            document.getElementById(
                "transactionTitle"
            ).value.trim();


        const amount =
            Number(
                document.getElementById(
                    "transactionAmount"
                ).value
            );


        const date =
            document.getElementById(
                "transactionDate"
            ).value;


        const category =
            document.getElementById(
                "transactionCategory"
            ).value;


        const note =
            document.getElementById(
                "transactionNote"
            ).value.trim();


        const type =
            transactionType.value;


        if (!title || !amount || amount <= 0 || !date) {

            showToast(
                "Invalid entry",
                "Please fill all required fields."
            );

            return;
        }


        const newTransaction = {

            id:
                Date.now().toString(),

            title,

            amount,

            date,

            category,

            note,

            type
        };


        appData.transactions.push(
            newTransaction
        );


        saveData();

        transactionForm.reset();

        transactionType.value =
            "expense";


        typeButtons.forEach(
            btn => btn.classList.remove("active")
        );


        typeButtons[0].classList.add("active");


        closeTransaction();

        updateDashboard();


        showToast(
            "Transaction added",
            `${type === "income" ? "Income" : "Expense"} saved successfully.`
        );

    }
);


/* =========================================================
   15. DELETE TRANSACTION
   ========================================================= */

function deleteTransaction(id) {

    const transaction =
        appData.transactions.find(
            item => item.id === id
        );


    if (!transaction) {
        return;
    }


    appData.transactions =
        appData.transactions.filter(
            item => item.id !== id
        );


    saveData();

    updateDashboard();


    showToast(
        "Transaction deleted",
        "The transaction was removed from your vault."
    );
}


/* Make function available to inline HTML */

window.deleteTransaction =
    deleteTransaction;


/* =========================================================
   16. BUDGET MODAL
   ========================================================= */

const budgetModal =
    document.getElementById("budgetModal");

const editBudget =
    document.getElementById("editBudget");

const closeBudgetModal =
    document.getElementById("closeBudgetModal");

const budgetForm =
    document.getElementById("budgetForm");


editBudget.addEventListener(
    "click",
    () => {

        budgetModal.classList.add("active");

        document.getElementById(
            "budgetAmount"
        ).value =
            appData.budget || "";
    }
);


closeBudgetModal.addEventListener(
    "click",
    () => {

        budgetModal.classList.remove("active");
    }
);


budgetForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const amount =
            Number(
                document.getElementById(
                    "budgetAmount"
                ).value
            );


        if (!amount || amount <= 0) {

            showToast(
                "Invalid budget",
                "Enter a valid monthly budget."
            );

            return;
        }


        appData.budget =
            amount;


        saveData();

        updateDashboard();


        budgetModal.classList.remove(
            "active"
        );


        showToast(
            "Budget updated",
            "Your monthly budget has been saved."
        );
    }
);


/* =========================================================
   17. GOAL MODAL
   ========================================================= */

const goalModal =
    document.getElementById("goalModal");

const editGoal =
    document.getElementById("editGoal");

const closeGoalModal =
    document.getElementById("closeGoalModal");

const goalForm =
    document.getElementById("goalForm");


editGoal.addEventListener(
    "click",
    () => {

        goalModal.classList.add("active");


        document.getElementById(
            "goalTitle"
        ).value =
            appData.goal.name || "";


        document.getElementById(
            "goalAmount"
        ).value =
            appData.goal.target || "";


        document.getElementById(
            "goalInitial"
        ).value =
            appData.goal.saved || 0;
    }
);


closeGoalModal.addEventListener(
    "click",
    () => {

        goalModal.classList.remove(
            "active"
        );
    }
);


goalForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const name =
            document.getElementById(
                "goalTitle"
            ).value.trim();


        const target =
            Number(
                document.getElementById(
                    "goalAmount"
                ).value
            );


        const saved =
            Number(
                document.getElementById(
                    "goalInitial"
                ).value
            ) || 0;


        if (!name || !target || target <= 0) {

            showToast(
                "Invalid goal",
                "Enter a goal name and target amount."
            );

            return;
        }


        appData.goal = {

            name,

            target,

            saved:
                Math.min(saved, target)
        };


        saveData();

        updateDashboard();


        goalModal.classList.remove(
            "active"
        );


        showToast(
            "Goal created",
            "Your savings goal is ready."
        );
    }
);


/* =========================================================
   18. ADD SAVINGS
   ========================================================= */

const savingModal =
    document.getElementById("savingModal");

const addToGoal =
    document.getElementById("addToGoal");

const closeSavingModal =
    document.getElementById("closeSavingModal");

const savingForm =
    document.getElementById("savingForm");


addToGoal.addEventListener(
    "click",
    () => {

        if (
            !appData.goal.name ||
            !appData.goal.target
        ) {

            showToast(
                "No goal yet",
                "Create a savings goal first."
            );

            return;
        }


        savingModal.classList.add(
            "active"
        );

        document.getElementById(
            "savingAmount"
        ).focus();
    }
);


closeSavingModal.addEventListener(
    "click",
    () => {

        savingModal.classList.remove(
            "active"
        );
    }
);


savingForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const amount =
            Number(
                document.getElementById(
                    "savingAmount"
                ).value
            );


        if (!amount || amount <= 0) {

            showToast(
                "Invalid amount",
                "Enter a valid savings amount."
            );

            return;
        }


        appData.goal.saved =
            Math.min(
                Number(appData.goal.target),
                Number(appData.goal.saved) + amount
            );


        saveData();

        updateDashboard();


        savingForm.reset();

        savingModal.classList.remove(
            "active"
        );


        showToast(
            "Savings added",
            `${formatMoney(amount)} added to your goal.`
        );
    }
);


/* =========================================================
   19. SEARCH + FILTER
   ========================================================= */

const transactionSearch =
    document.getElementById(
        "transactionSearch"
    );

const transactionFilter =
    document.getElementById(
        "transactionFilter"
    );


function refreshTransactionList() {

    renderAllTransactions(
        transactionSearch.value,
        transactionFilter.value
    );
}


transactionSearch.addEventListener(
    "input",
    refreshTransactionList
);


transactionFilter.addEventListener(
    "change",
    refreshTransactionList
);


/* =========================================================
   20. CHART
   ========================================================= */

let financeChart = null;


function getMonthlyChartData(monthCount = 6) {

    const labels = [];

    const incomeData = [];

    const expenseData = [];


    const now = new Date();


    for (
        let i = monthCount - 1;
        i >= 0;
        i--
    ) {

        const date =
            new Date(
                now.getFullYear(),
                now.getMonth() - i,
                1
            );


        const year =
            date.getFullYear();

        const month =
            date.getMonth();


        labels.push(
            date.toLocaleDateString(
                "en-IN",
                {
                    month: "short"
                }
            )
        );


        let income = 0;
        let expense = 0;


        appData.transactions.forEach(
            transaction => {

                const transactionDate =
                    new Date(
                        transaction.date +
                        "T00:00:00"
                    );


                if (
                    transactionDate.getFullYear() !== year ||
                    transactionDate.getMonth() !== month
                ) {

                    return;
                }


                const amount =
                    Number(transaction.amount);


                if (
                    transaction.type === "income"
                ) {

                    income += amount;

                } else {

                    expense += amount;
                }

            }
        );


        incomeData.push(income);

        expenseData.push(expense);
    }


    return {
        labels,
        incomeData,
        expenseData
    };
}


function updateChart() {

    const canvas =
        document.getElementById(
            "financeChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    const period =
        Number(
            document.getElementById(
                "chartPeriod"
            )?.value || 6
        );


    const data =
        getMonthlyChartData(period);


    if (financeChart) {

        financeChart.destroy();
    }


    financeChart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: data.labels,

                datasets: [

                    {
                        label: "Income",

                        data: data.incomeData,

                        borderColor: "#48d597",

                        backgroundColor:
                            "rgba(72,213,151,0.08)",

                        borderWidth: 2,

                        pointRadius: 3,

                        pointHoverRadius: 5,

                        tension: 0.35,

                        fill: true
                    },

                    {
                        label: "Expenses",

                        data: data.expenseData,

                        borderColor: "#ff626b",

                        backgroundColor:
                            "rgba(255,98,107,0.06)",

                        borderWidth: 2,

                        pointRadius: 3,

                        pointHoverRadius: 5,

                        tension: 0.35,

                        fill: true
                    }

                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {

                    legend: {
                        display: true,

                        labels: {
                            color: "#99999f",

                            boxWidth: 8,

                            boxHeight: 8,

                            usePointStyle: true,

                            font: {
                                size: 9
                            }
                        }
                    },

                    tooltip: {

                        backgroundColor:
                            "#17171a",

                        borderColor:
                            "rgba(255,255,255,0.1)",

                        borderWidth: 1,

                        titleColor: "#fff",

                        bodyColor: "#aaa",

                        padding: 10,

                        callbacks: {

                            label:
                                function(context) {

                                    return ` ${
                                        context.dataset.label
                                    }: ${
                                        formatMoney(
                                            context.raw
                                        )
                                    }`;
                                }
                        }
                    }
                },

                scales: {

                    x: {

                        grid: {
                            display: false
                        },

                        ticks: {
                            color: "#626269",

                            font: {
                                size: 9
                            }
                        }
                    },

                    y: {

                        beginAtZero: true,

                        grid: {
                            color:
                                "rgba(255,255,255,0.045)"
                        },

                        ticks: {

                            color: "#626269",

                            font: {
                                size: 8
                            },

                            callback:
                                function(value) {

                                    if (
                                        value >= 100000
                                    ) {

                                        return "₹" +
                                            (
                                                value / 100000
                                            ).toFixed(1)
                                            + "L";
                                    }

                                    if (
                                        value >= 1000
                                    ) {

                                        return "₹" +
                                            (
                                                value / 1000
                                            ).toFixed(0)
                                            + "K";
                                    }

                                    return "₹" + value;
                                }
                        }
                    }
                }
            }
        });
}


/* Chart period */

const chartPeriod =
    document.getElementById(
        "chartPeriod"
    );


if (chartPeriod) {

    chartPeriod.addEventListener(
        "change",
        updateChart
    );
}


/* =========================================================
   21. NAVIGATION
   ========================================================= */

const dashboardSection =
    document.getElementById("dashboard");

const transactionsPage =
    document.getElementById(
        "transactionsPage"
    );

const navItems =
    document.querySelectorAll(".nav-item");


function showPage(page) {

    if (page === "transactions") {

        dashboardSection.style.display =
            "none";

        transactionsPage.style.display =
            "block";

    } else {

        dashboardSection.style.display =
            "block";

        transactionsPage.style.display =
            "none";
    }
}


navItems.forEach(item => {

    item.addEventListener(
        "click",
        event => {

            event.preventDefault();


            navItems.forEach(
                nav =>
                    nav.classList.remove(
                        "active"
                    )
            );


            item.classList.add(
                "active"
            );


            const href =
                item.getAttribute("href");


            if (
                href === "#transactions"
            ) {

                showPage("transactions");

            } else {

                showPage("dashboard");
            }

        }
    );

});


/* View all transactions */

const viewAllTransactions =
    document.getElementById(
        "viewAllTransactions"
    );


viewAllTransactions.addEventListener(
    "click",
    event => {

        event.preventDefault();


        navItems.forEach(
            nav =>
                nav.classList.remove(
                    "active"
                )
        );


        document.querySelector(
            '.nav-item[href="#transactions"]'
        )?.classList.add("active");


        showPage("transactions");
    }
);


/* =========================================================
   22. TOAST
   ========================================================= */

let toastTimeout;


function showToast(
    title,
    message
) {

    toastTitle.textContent =
        title;

    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   23. CLOSE MODALS WHEN CLICKING OUTSIDE
   ========================================================= */

document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    overlay.classList.remove(
                        "active"
                    );
                }

            }
        );

    });


/* =========================================================
   24. ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }


        document
            .querySelectorAll(
                ".modal-overlay.active"
            )
            .forEach(modal => {

                modal.classList.remove(
                    "active"
                );

            });

    }
);


/* =========================================================
   25. NOTIFICATION BUTTON
   ========================================================= */

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );


notificationBtn.addEventListener(
    "click",
    () => {

        showToast(
            "WILDFIRE VAULT",
            "Your financial data is stored locally."
        );

    }
);


/* =========================================================
   26. INITIALIZE APP
   ========================================================= */

function initializeApp() {

    updateDashboard();

    showPage("dashboard");

    console.log(
        "🔥 WILDFIRE VAULT initialized successfully."
    );

}


initializeApp();
