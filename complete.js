document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  const saveButton = document.getElementById('saveCapture');
  const closeButton = document.getElementById('close');
  const review = document.getElementById('review');
  const status = document.getElementById('status');
  let format;
  let audioURL;
  let encoding = false;
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "createTab") {
      format = request.format;
      let startID = request.startID;
      status.innerHTML = "Please wait..."
      closeButton.onclick = () => {
        chrome.runtime.sendMessage({ cancelEncodeID: startID });
        chrome.tabs.getCurrent((tab) => {
          chrome.tabs.remove(tab.id);
        });
      }

      //if the encoding completed before the page has loaded
      if (request.audioURL) {
        encodeProgress.style.width = '100%';
        status.innerHTML = "File is ready!"
        generateSave(request.audioURL, request.blob);
      } else {
        encoding = true;
      }
    }

    //when encoding completes
    if (request.type === "encodingComplete" && encoding) {
      encoding = false;
      status.innerHTML = "File is ready!";
      encodeProgress.style.width = '100%';
      generateSave(request.audioURL, request.blob);
    }
    //updates encoding process bar upon messages
    if (request.type === "encodingProgress" && encoding) {
      encodeProgress.style.width = `${request.progress * 100}%`;
    }
    async function generateSave(url, blob) { //creates the save button
      const currentDate = new Date(Date.now()).toUTCString();
      const bucketName = 'minutescypher';
      const contents = blob;
      saveButton.onclick = async () => {
        const destFileName = `${currentDate}.${format}`;
        var fd = new FormData();
        let blobf = await fetch(url).then(r => r.blob());
        fd.append('upl', blobf, destFileName);
        fd.append('Sentimental', document.getElementById("Sentimental").checked);
        fd.append('Summarisation', document.getElementById("Summarisation").checked);
        fd.append('Moderation', document.getElementById("Moderation").checked);
        fd.append('Phrases', document.getElementById("Phrases").checked);
        fd.append('PII', document.getElementById("PII").checked);
        fd.append('Topic', document.getElementById("Topic").checked);
        fd.append('Filename', destFileName);
        console.log(fd);
        const resp = await fetch("http://localhost:5050/audio", { method: 'POST', body: fd });
        console.log(resp);
        // console.log(url)
        // chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
      };
      saveButton.style.display = "inline-block";
    }
  });
  review.onclick = () => {
    chrome.tabs.create({ url: "https://chrome.google.com/webstore/detail/chrome-audio-capture/kfokdmfpdnokpmpbjhjbcabgligoelgp/reviews" });
  }


})
