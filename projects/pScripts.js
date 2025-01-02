// Select all parent divs with the class "pItem"
const pItemContainers = document.querySelectorAll('.pItem');

// Define the hover image source
const hoverSrc = 'https://img.icons8.com/?size=100&id=2939&format=png&color=7950F2';

// Set up hover event listeners for each parent div
pItemContainers.forEach((container) => {
    // Get the child image within this container
    const image = container.querySelector('.folder');

    if (!image) {
        console.log("No image with class 'folder' found inside:", container);
        return; // Exit if there's no image with the class 'folder' inside this container
    }

    // Store the original src of the image
    const originalSrc = image.src;

    // Function to check if any children are visible
    const areChildrenVisible = () => {
        return Array.from(container.querySelectorAll('.hidden')).some(child => child.style.display === 'block');
    };

    // Update image src based on child visibility
    const updateImageSrc = () => {
        if (areChildrenVisible()) {
            image.src = hoverSrc;
        } else {
            image.src = originalSrc;
        }
    };

    // Add hover event listeners to the parent div
    container.addEventListener('mouseenter', () => {
        if (!areChildrenVisible()) { // Only change src on hover if children aren't visible
            image.src = hoverSrc;
        }
    });

    container.addEventListener('mouseleave', () => {
        if (!areChildrenVisible()) { // Only revert src if children aren't visible
            image.src = originalSrc;
        }
    });

    // Add click event listener to toggle visibility of .hidden children
    container.addEventListener('click', () => {
        container.querySelectorAll('.hidden').forEach(child => {
            child.style.display = (child.style.display === 'none' || child.style.display === '') ? 'block' : 'none';
        });
        updateImageSrc(); // Update image src based on new visibility state of children
    });

    // Prevent clicks on .hidden elements from bubbling up to the container
    container.querySelectorAll('.hidden').forEach(child => {
        child.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents click from reaching the container
        });
    });
});
