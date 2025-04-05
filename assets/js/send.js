// Initialize Firestore
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    loadAvailableLetters();
    
    document.getElementById('sendLetters')?.addEventListener('click', sendSelectedLetters);
});

async function loadAvailableLetters() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const lettersSnapshot = await db.collection('requests')
            .where('userId', '==', user.uid)
            .where('status', '==', 'completed')
            .get();
        
        const lettersDiv = document.getElementById('letterSelection');
        lettersDiv.innerHTML = '';
        
        if (lettersSnapshot.empty) {
            lettersDiv.innerHTML = '<p>No completed letters available yet.</p>';
            return;
        }
        
        lettersSnapshot.forEach(doc => {
            const data = doc.data();
            const letterDiv = document.createElement('div');
            letterDiv.className = 'letter-item';
            letterDiv.innerHTML = `
                <label>
                    <input type="checkbox" name="selectedLetters" value="${doc.id}">
                    <strong>${data.recommenderName}</strong> - ${data.purpose}
                    ${data.downloadUrl ? `<a href="${data.downloadUrl}" target="_blank">(View)</a>` : ''}
                </label>
            `;
            lettersDiv.appendChild(letterDiv);
        });
    } catch (error) {
        console.error("Error loading letters:", error);
        document.getElementById('letterSelection').innerHTML = 
            '<p>Error loading letters. Please refresh.</p>';
    }
}

async function sendSelectedLetters() {
    const recipientName = document.getElementById('recipientName').value;
    const recipientEmail = document.getElementById('recipientEmail').value;
    const customMessage = document.getElementById('customMessage').value;
    
    if (!recipientName || !recipientEmail) {
        alert('Please enter recipient information');
        return;
    }
    
    const selectedLetters = Array.from(
        document.querySelectorAll('input[name="selectedLetters"]:checked')
    ).map(checkbox => checkbox.value);
    
    if (selectedLetters.length === 0) {
        alert('Please select at least one letter');
        return;
    }
    
    try {
        // In a real app, you would send emails here
        // For now, we'll just simulate it
        
        const statusDiv = document.getElementById('sendStatus');
        statusDiv.innerHTML = '<p class="sending">Sending letters...</p>';
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        statusDiv.innerHTML = `
            <p class="success">
                Success! ${selectedLetters.length} letter(s) sent to ${recipientName} at ${recipientEmail}.
            </p>
            <p>In a production app, this would actually send the emails with attachments.</p>
        `;
        
        // Clear form
        document.getElementById('recipientName').value = '';
        document.getElementById('recipientEmail').value = '';
        document.getElementById('customMessage').value = '';
        document.querySelectorAll('input[name="selectedLetters"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    } catch (error) {
        console.error("Error sending letters:", error);
        document.getElementById('sendStatus').innerHTML = 
            `<p class="error">Failed to send letters: ${error.message}</p>`;
    }
}