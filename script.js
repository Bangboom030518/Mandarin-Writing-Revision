const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randChoice = (array) => array[randInt(0, array.length - 1)];
const getData = async () => (await fetch("gcse.json")).text();
const hide = (element) => element.classList.add("hidden");
const show = (element) => element.classList.remove("hidden");
const includesMultiple = (array, values) =>
  values.every((value) => array.includes(value));
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const dataLength = JSON.parse(
  localStorage.getItem("data-length") ??
    (await (async () => {
      const length = Object.keys(JSON.parse(await getData())).length;
      localStorage.setItem("data-length", length);
      return length;
    })())
);

const data = JSON.parse(
  localStorage.getItem("data") ??
    (await (async () => {
      const serverData = await getData();
      localStorage.setItem("data", serverData);
      return serverData;
    })())
);

const learnedCharacters = JSON.parse(
  localStorage.getItem("learned") ??
    (() => {
      localStorage.setItem("learned", "[]");
      return "[]";
    })()
);

const removeBlacklist = JSON.parse(
  localStorage.getItem("remove-blacklist") ??
    (() => {
      localStorage.setItem("remove-blacklist", "[]");
      return "[]";
    })()
);

const difficultTerms = JSON.parse(
  localStorage.getItem("difficult-terms") ??
    (() => {
      localStorage.setItem("difficult-terms", "[]");
      return "[]";
    })()
);

const btnYes = document.querySelector("#yes");
const btnNo = document.querySelector("#no");
const btnReveal = document.querySelector("#reveal");
const wordOutput = document.querySelector("#word");
const answerOutput = document.querySelector("#answer");
const progress = document.querySelector("#progress");
const numberLearntOutput = document.querySelector("#number");
const totalOutput = document.querySelector("#total");
const learntTermsOutput = document.querySelector("#learned-terms");
const progressPercentageOutput = document.querySelector("#progress-percentage");

const formatData = (current) =>
  Object.entries(data).forEach(([chinese, english]) => {
    if (removeBlacklist.includes(chinese) && chinese !== current) return;
    if (
      !includesMultiple(
        learnedCharacters,
        chinese.replace(/[。？，]/g, "").split("")
      )
    )
      return;
    learntTermsOutput.innerHTML += `
      <li>
        <p data-answer="${english}">${chinese}</p>
        <button class="btn-cancel">Undo</button>
      </li>
    `;
    addCancelEvents();
    delete data[chinese];
    localStorage.setItem("data", JSON.stringify(data));
  });

function updateProgress() {
  const numberLearnt = dataLength - Object.keys(data).length;
  const percentage = (numberLearnt / dataLength) * 100;
  progressPercentageOutput.innerText = `${Math.round(percentage)}%`;
  progress.style.width = `${percentage}%`;
  numberLearntOutput.innerText = numberLearnt.toString();
}

function updateText() {
  updateProgress();
  hide(answerOutput);
  hide(btnNo);
  hide(btnYes);
  show(btnReveal);
  [answerOutput.innerText, wordOutput.innerText] = randChoice(
    Object.entries(data)
  );
}

function addCancelEvents() {
  function cancelEvent(event) {
    const btn = event.currentTarget;
    const previous = btn.previousElementSibling;
    data[previous.innerText] = previous.dataset.answer;
    localStorage.setItem("data", JSON.stringify(data));
    removeBlacklist.push(previous.innerText);
    localStorage.setItem("remove-blacklist", JSON.stringify(removeBlacklist));
    updateProgress();
    btn.parentElement.remove();
    addCancelEvents();
  }

  document.querySelectorAll(".btn-cancel").forEach((btn) => {
    btn.removeEventListener("click", cancelEvent);
    btn.addEventListener("click", cancelEvent);
  });
}

btnYes.addEventListener("click", async () => {
  learnedCharacters.push(...answerOutput.textContent.split(""));
  localStorage.setItem("learned", JSON.stringify(learnedCharacters));
  await sleep(10);
  learntTermsOutput.innerHTML = "";
  formatData(answerOutput.innerText);
  updateText();
});

btnNo.addEventListener("click", () => {
  difficultTerms.push(answerOutput.textContent);
  localStorage.setItem("need-work", difficultTerms);
  updateText();
});

btnReveal.addEventListener("click", () => {
  show(btnNo);
  show(btnYes);
  show(answerOutput);
  hide(btnReveal);
});

totalOutput.innerText = dataLength.toString();

updateText();
