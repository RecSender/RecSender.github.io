let recommenders = [];
let lettersSent = 0;

document.getElementById("recommenderForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("recName").value.trim();
  const position = document.getElementById("recPosition").value.trim();
  const email = document.getElementById("recEmail").value.trim();

  if (name && position && email) {
    const newRec = {
      name,
      position,
      email,
      status: "pending"
    };
    recommenders.push(newRec);
    updateRecommenderList();
    document.getElementById("recommenderForm").reset();
  }
});

function updateRecommenderList() {
  const list = document.getElementById("recommenderList");
  const checkboxes = document.getElementById("recommenderCheckboxes");
  list.innerHTML = "";
  checkboxes.innerHTML = "";

  let submittedCount = 0;

  recommenders.forEach((rec, index) => {
    // Simulate submission if you want with random logic
    if (Math.random() > 0.5 && rec.status === "pending") {
      rec.status = "submitted";
    }

    if (rec.status === "submitted") submittedCount++;

    const li = document.createElement("li");
    li.innerHTML = `
      <span>${rec.name} (${rec.position})</span>
      <span class="status ${rec.status}">${rec.status.toUpperCase()}</span>
    `;
    list.appendChild(li);

    if (rec.status === "submitted") {
      const checkbox = document.createElement("div");
      checkbox.innerHTML = `
        <label>
          <input type="checkbox" value="${index}" /> ${rec.name} (${rec.position})
        </label>
      `;
      checkboxes.appendChild(checkbox);
    }
  });

  document.getElementById("totalRequested").innerText = recommenders.length;
  document.getElementById("totalSubmitted").innerText = submittedCount;
  document.getElementById("totalSent").innerText = lettersSent;
}

function sendLetters() {
  const selectedRecs = Array.from(
    document.querySelectorAll('#recommenderCheckboxes input:checked')
  ).map(input => recommenders[parseInt(input.value)]);

  const emails = document.getElementById("recipientEmails").value.split(",").map(e => e.trim()).filter(Boolean);

  if (emails.length && selectedRecs.length) {
    alert(`Sent ${selectedRecs.length} letters to ${emails.length} recipients!`);
    lettersSent += selectedRecs.length * emails.length;
    updateRecommenderList();
  } else {
    alert("Please select at least one recommender and enter recipient emails.");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// Simulate user data
document.getElementById("userName").innerText = "Alex Johnson"; // Simulated Google name

// Function to handle the sending of the request
async function requestRecommendationLetter(recommenderName, recommenderEmail, userName) {
  const response = await fetch('http://localhost:4000/request-letter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recommenderName,
      recommenderEmail,
      userName
    })
  });

  const data = await response.json();
  if (response.status === 200) {
    alert('Request email sent successfully!');
  } else {
    alert('Failed to send request email.');
  }
}

// Attach the function to the form submission
document.getElementById('requestLetterForm').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent form from submitting the traditional way

  // Get the values from the form inputs
  const userName = document.getElementById('userName').value;
  const recommenderName = document.getElementById('recommenderName').value;
  const recommenderEmail = document.getElementById('recommenderEmail').value;

  // Call the function to send the request email
  requestRecommendationLetter(recommenderName, recommenderEmail, userName);
});
