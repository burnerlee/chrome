function showAnalysis(body){
  let ana = document.getElementById("analysis");
  ana.appendChild(getHeading("Transcript"));
  ana.appendChild(showPara(body.text));
  if(document.getElementById("Sentimental").checked){
    ana.appendChild(getHeading("Sentimental Analysis Results"));
    for(let i = 0; i < body.sentiment_analysis_results.length;i++){
      ana.appendChild(getSpan(body.sentiment_analysis_results[i]));
      ana.appendChild(document.createElement("br"));
    }
  }
  if(document.getElementById("Summarisation").checked){
    ana.appendChild(getHeading("Summary"));
    ana.appendChild(showPara(body.summary));
  }
  if(document.getElementById("Moderation")){
    ana.appendChild(getHeading("Content Moderation"));
    let res = body.content_safety_labels;
    if(res.status == 'success'){
      ana.appendChild(showPara("The following labels were found in the context"));
      for(let i=0;i<res.results.length;i++){
        ana.appendChild(showPara(body.results[i].text));
      }
    }else{
      ana.appendChild(showPara("No labels were found"))
    }
  }
  if(document.getElementById("Phrases").checked){
    let res = body.auto_highlights_result;
    ana.appendChild(getHeading("Important phrases"));
    if(res.status == 'success'){
      for(let i=0;i<res.results.length;i++){
        ana.appendChild(showPara(res.results[i].text));
      }
    }else{
      ana.appendChild(showPara("No important phrases were found"));
    }
  }

  if(document.getElementById("Topic").checked){
    let res = body.iab_categories_result;
    ana.appendChild(getHeading("Suggested topics"));
    if(res.status == 'success'){
      for(let i=0;i<res.results[0].labels.length;i++){
        ana.appendChild(showPara(res.results[0].labels[i].label + " - with a relevance of " + res.results[0].labels[i].relevance + "/1.0"));
      }
    }else{
      ana.appendChild(showPara("No topics could be suggested by the algorithm"));
    }
  }

}

function getHeading(text){
  const node = document.createElement("h1");
  node.textContent = text;
  return node;
}

function showPara(text){
  const node = document.createElement("p");
  node.textContent = text;
  return node;
}

function getSpan(info){
  const node = document.createElement("span");
  node.innerHTML = info.text;
  if(info.sentiment == "POSITIVE"){
    node.style.color = "green";
  }else if(info.sentiment == "NEUTRAL"){
    node.style.color = "orange";
  }else{
    node.style.color = "red";
  }
  return node;
}

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
        document.getElementById('loading').style.visibility = 'visible';
        document.getElementsByClassName('buttonContainer')[0].style.display = 'none';
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
        // console.log(fd);
        const resp = await fetch("http://localhost:5050/audio", { method: 'POST', body: fd });
        let body = await resp.json();
        console.log(body);
        document.getElementById('loading').style.display = 'none';
        alert("Your analysis is now ready!!")
        // console.log(url)
        // chrome.downloads.download({url: url, filename: `${currentDate}.${format}`, saveAs: true});
        showAnalysis(body);
      };
      saveButton.style.display = "inline-block";
    }
  });
  review.onclick = () => {
    chrome.tabs.create({ url: "https://chrome.google.com/webstore/detail/chrome-audio-capture/kfokdmfpdnokpmpbjhjbcabgligoelgp/reviews" });
  }


})
