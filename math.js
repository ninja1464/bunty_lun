var answer;
var score = 0;
var backgroundImages = [];
function nextQuestion() {
  const n1 = Math.floor(Math.random() * 5);
  document.getElementById("n1").innerHTML = n1;

  const n2 = Math.floor(Math.random() * 6);
  document.getElementById("n2").innerHTML = n2;

  answer = n1 + n2;
}

function checkAnswer() {
  const prediction = predictImage();
  console.log(`answer : ${answer}, prediction: ${prediction}`);

  if (prediction == answer) {
    score++;
    if (score <= 6) {
      console.log(`correct. score :${score}`);
      backgroundImages.push(`url('images/background${score}.svg')`);

      // Set the background images as a comma-separated string
      document.body.style.backgroundImage = backgroundImages.join(", ");
    } else {
      score = 0;
      alert("WELL DONE");
      backgroundImages = [];
      document.body.style.backgroundImage = backgroundImages;
    }
  } else {
    if (score != 0) {
      score--;
    }
    alert("Oops, Check your Calculations");
    setTimeout(function () {
      backgroundImages.pop();
      document.body.style.backgroundImage = backgroundImages;
    }, 1000);
  }
}
