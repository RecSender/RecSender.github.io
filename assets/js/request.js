// Initialize Firestore
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
    
    document.getElementById('sendRequest')?.addEventListener('click', sendLetterRequest);
});

async function sendLetterRequest() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const name = document.getElementById('recommenderName').value;
    const email = document.getElementById('recommenderEmail').value;
    const purpose = document.getElementById('letterPurpose').value;
    
    if (!name || !email || !purpose) {
        alert('Please fill all fields');
        return;
    }

    try {
        await db.collection('requests').add({
            userId: user.uid,
            recommenderName: name,
            recommenderEmail: email,
            purpose: purpose,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            studentName: user.displayName || 'A student'
        });
        
        // Clear form
        document.getElementById('recommenderName').value = '';
        document.getElementById('recommenderEmail').value = '';
        document.getElementById('letterPurpose').value = '';
        
        // Reload requests
        loadRequests();
        
        alert('Request sent successfully! An email has been sent to the recommender.');
    } catch (error) {
        console.error("Error sending request:", error);
        alert('Failed to send request: ' + error.message);
    }
}

async function loadRequests() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const requestsSnapshot = await db.collection('requests')
            .where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc')
            .get();
        
        const pendingDiv = document.getElementById('pendingRequests');
        const receivedDiv = document.getElementById('receivedLetters');
        
        pendingDiv.innerHTML = '<h4>Pending</h4>';
        receivedDiv.innerHTML = '<h4>Received</h4>';
        
        if (requestsSnapshot.empty) {
            pendingDiv.innerHTML += '<p>No pending requests</p>';
            receivedDiv.innerHTML += '<p>No received letters</p>';
            return;
        }
        
        requestsSnapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'request-item';
            
            if (data.status === 'pending') {
                item.innerHTML = `
                    <p><strong>${data.recommenderName}</strong></p>
                    <p>Email: ${data.recommenderEmail}</p>
                    <p>Purpose: ${data.purpose}</p>
                    <p class="status pending">Status: ${data.status}</p>
                    <p>Requested: ${new Date(data.createdAt?.toDate()).toLocaleDateString()}</p>
                `;
                pendingDiv.appendChild(item);
            } else if (data.status === 'completed') {
                item.innerHTML = `
                    <p><strong>From: ${data.recommenderName}</strong></p>
                    <p>Purpose: ${data.purpose}</p>
                    <p class="status completed">Status: ${data.status}</p>
                    <p>Received: ${new Date(data.completedAt?.toDate()).toLocaleDateString()}</p>
                    ${data.downloadUrl ? `<a href="${data.downloadUrl}" target="_blank">View Letter</a>` : ''}
                `;
                receivedDiv.appendChild(item);
            }
        });
    } catch (error) {
        console.error("Error loading requests:", error);
        document.getElementById('pendingRequests').innerHTML = 
            '<p>Error loading requests. Please refresh.</p>';
        document.getElementById('receivedLetters').innerHTML = 
            '<p>Error loading letters. Please refresh.</p>';
    }
}