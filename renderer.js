const apiUrl = 'http://localhost:8080/api/mirror';
const rootName = 'Root /';
let originalTreeData = null;
let isDownloading = false;
let notificationSound = null;

async function fetchAndDisplayData() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const treeElement = document.getElementById('tree');

    try {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            treeElement.style.opacity = '0.3';
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        treeElement.innerHTML = '';

        const root = { name: rootName, children: [] };

        data.forEach(item => {
            if (item.size === undefined || item.size === null) {
                item.size = 0;
            }

            const pathParts = item.path.replace(/^\/MIRROR\//, '').split('/').filter(Boolean);
            let current = root;

            pathParts.forEach((part, index) => {
                if (!current.children) {
                    current.children = []; 
                }
            
                let existing = current.children.find(child => child.name === part);
            
                if (!existing) {
                    existing = {
                        name: part,
                        path: item.path,
                        children: index === pathParts.length - 1 ? null : [], 
                        size: item.size,
                        modified: item.modified
                    };
                    current.children.push(existing);
                }
            
                current = existing;
            });
        });

        originalTreeData = root;
        displayTree(root);
        updateTotalSizeAndCount(data);

    } catch (error) {
        console.error('Error fetching data:', error);
        
        window.electron.showNotification({
            title: 'Fetch Error',
            body: 'Failed to retrieve data from server'
        });

    } finally {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            treeElement.style.opacity = '1';
        }
    }
}

function calculateTotalSizeAndCount(data) {
    let totalSize = 0;
    let totalCount = 0;

    data.forEach(item => {
        if (item.path.toLowerCase().endsWith('.iso') || item.path.toLowerCase().endsWith('.img')) {
            totalSize += item.size || 0;
            totalCount += 1;
        }
    });

    return { totalSize, totalCount };
}

function formatSize(bytes) {
    if (bytes === undefined || bytes === null || isNaN(bytes)) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function updateTotalSizeAndCount(data) {
    const { totalSize, totalCount } = calculateTotalSizeAndCount(data);
    const totalSizeElement = document.getElementById('total-size');
    const totalCountElement = document.getElementById('total-count');

    if (totalSizeElement && totalCountElement) {
        totalSizeElement.textContent = `Total Size: ${formatSize(totalSize)}`;
        totalCountElement.textContent = `Total Images: ${totalCount}`;
    }
}

function displayTree(node, parentElement = document.getElementById('tree')) {
    if (!node || !node.name) {
        return;
    }

    const li = document.createElement('li');

    const icon = document.createElement('i');
    icon.classList.add('material-icons');

    const lowerCaseName = node.name.toLowerCase();
    if (node.children) {
        icon.textContent = 'folder_open';
    } else if (lowerCaseName.endsWith('.md') || lowerCaseName.endsWith('.txt')) {
        icon.textContent = 'description';
        li.classList.add('text-file');
    } else if (lowerCaseName.endsWith('.iso') || lowerCaseName.endsWith('.img')) {
        icon.textContent = 'album';
        li.classList.add('file');
    } else {
        icon.textContent = 'insert_drive_file';
        li.classList.add('file');
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = node.name;

    li.appendChild(icon);
    li.appendChild(textSpan);

    if (!node.children) {
        const infoContainer = document.createElement('div');
        infoContainer.style.marginLeft = 'auto';
        infoContainer.style.display = 'flex';
        infoContainer.style.alignItems = 'center';
        infoContainer.style.gap = '10px';

        const fileSize = document.createElement('span');
        fileSize.textContent = `Size: ${formatSize(node.size)}`;
        fileSize.style.color = 'var(--text-secondary)';

        const fileDate = document.createElement('span');
        fileDate.textContent = `Modified: ${new Date(node.modified * 1000).toLocaleDateString()}`;
        fileDate.style.color = 'var(--text-secondary)';

        const downloadButton = document.createElement('button');
        downloadButton.classList.add('download-button');
        downloadButton.innerHTML = '<i class="material-icons">cloud_download</i>';
        downloadButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            await downloadSingleFile(node);
        });

        infoContainer.appendChild(fileSize);
        infoContainer.appendChild(fileDate);
        infoContainer.appendChild(downloadButton);

        li.appendChild(infoContainer);
    }

    if (node.children) {
        const ul = document.createElement('ul');
        ul.style.display = 'block';
        node.children.forEach(child => displayTree(child, ul));
        li.appendChild(ul);

        if (node.name !== rootName) {
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                if (ul.style.display === 'none') {
                    ul.style.display = 'block';
                    icon.textContent = 'folder_open';
                } else {
                    ul.style.display = 'none';
                    icon.textContent = 'folder';
                }
            });
        }
    }

    parentElement.appendChild(li);
}

function initializeNotificationSound() {
    notificationSound = new Audio('assets/notification.mp3');
}

async function downloadSingleFile(fileDetails) {
    try {
        const sanitizedPath = fileDetails.path.replace(/^\/MIRROR\//, '');
        const downloadUrl = `http://localhost:8080/download/${encodeURIComponent(sanitizedPath)}`;

        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.statusText}`);
        }

        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            const progress = (receivedLength / contentLength) * 100;
            updateProgress(progress);
        }

        const blob = new Blob(chunks);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const filename = fileDetails.name || fileDetails.path.split('/').pop();
        link.setAttribute('download', filename);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        if (notificationSound) {
            try {
                notificationSound.currentTime = 0;
                await notificationSound.play();
            } catch (soundError) {
                console.error('Error playing notification sound:', soundError);
            }
        }

        window.electron.showNotification({
            title: 'Download Complete',
            body: `File saved: ${filename}`
        });

    } catch (error) {
        console.error('Download error:', error);
        window.electron.showNotification({
            title: 'Download Failed',
            body: error.message
        });
    }
}

function updateProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar && progressText) {
        progressBar.value = progress;
        progressText.textContent = `${Math.round(progress)}%`;
    }
}

function showNotificationCard() {
    const notificationCard = document.getElementById('notification-card');
    notificationCard.style.display = 'block';
}

function hideNotificationCard() {
    const notificationCard = document.getElementById('notification-card');
    notificationCard.style.display = 'none';
}

function toggleAllFolders(expand) {
    const folders = document.querySelectorAll('#tree li');
    folders.forEach(folder => {
        const ul = folder.querySelector('ul');
        const icon = folder.querySelector('.material-icons');
        const folderName = folder.querySelector('span').textContent;

        if (ul && folderName !== rootName) {
            ul.style.display = expand ? 'block' : 'none';
            icon.textContent = expand ? 'folder_open' : 'folder';
        }
    });
}

function filterTree(node, searchTerm) {
    if (!node || !node.name) {
        return null;
    }

    if (!node.children) {
        return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ? node : null;
    }

    const filteredChildren = node.children
        .map(child => filterTree(child, searchTerm))
        .filter(child => child !== null);

    if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
    }

    return node.name.toLowerCase().includes(searchTerm.toLowerCase()) ? node : null;
}

function handleSearch() {
    const searchTerm = document.getElementById('search-bar').value.trim();
    const treeElement = document.getElementById('tree');
    treeElement.innerHTML = '';

    if (searchTerm === '') {
        displayTree(originalTreeData);
    } else {
        const filteredTree = filterTree(originalTreeData, searchTerm);
        if (filteredTree) {
            displayTree(filteredTree);
        } else {
            const noResultsMessage = document.createElement('li');
            noResultsMessage.textContent = 'No results found';
            treeElement.appendChild(noResultsMessage);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayData();
    initializeNotificationSound();

    const searchBar = document.getElementById('search-bar');
    searchBar.addEventListener('input', handleSearch);

    const toggleButton = document.getElementById('toggle-all');
    let isExpanded = true;

    toggleButton.addEventListener('click', () => {
        isExpanded = !isExpanded;
        toggleAllFolders(isExpanded);
        toggleButton.innerHTML = isExpanded
            ? '<i class="material-icons">unfold_less</i> Collapse All'
            : '<i class="material-icons">unfold_more</i> Expand All';
    });

    const okButton = document.getElementById('notification-ok-button');
    okButton.addEventListener('click', hideNotificationCard);
});