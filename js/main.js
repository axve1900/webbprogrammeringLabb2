// Tar bort unsafe features
"use strict";

// Deklarerar baseURL
var baseURL = "https://api.sr.se/api/v2/";

// Vi skapar en funktion som laddar en ny beskrivning och musik
function loadChannel(channelId) {
    // Hämtar data från SR i XML format för given kanal
    let url = baseURL + "channels/" + channelId;

    // Skapar en ny XMLHttpRequest
    var request = new XMLHttpRequest();
    // Requesten görs med GET från vår url, synkad request. Dvs vi väntar ut den.
    request.open("GET", url, false);
    request.send();
    // Vi lagrar svaret i variabeln response
    var response = request.responseXML;
    
    // Ur response plockar vi själva kanalen ur XML datan
    const channelElement = response.querySelector("channel");

    // Skapar Header med namn
    var channelName = document.createTextNode(channelElement.getAttribute("name"));
    var channelHeader = document.createElement("h2"); 
    channelHeader.appendChild(channelName);

    // Skapar Header med namn
    var channelTagline = document.createTextNode(channelElement.querySelector("tagline").textContent);
    var channelContent = document.createElement("h3"); 
    channelContent.appendChild(channelTagline);
        
    // Ersätter nuvarande kanalinfo
    document.getElementById("info").replaceChildren(channelHeader, channelTagline);

    // Ersätter nuvarande ljudkälla
    audioElement.src = 'http://sverigesradio.se/topsy/direkt/' + channelId + '-hi.mp3';
    audioElement.play();
}

// Vi skapar en funktion som laddar en ny tablå men inte laddar in nytt ljud
function loadTabla(channelId) {
    // Hämtar alla program i dagens tablå (enligt dokumentation borde '&size=200' inte behövas, men utan denna hämtas bara en del av dagens tablå)
    const day = new Date().toISOString().split('T')[0];
    let url = baseURL + "scheduledepisodes?channelid=" + channelId + "&date=" + day + "&size=200";

    // Skapar en ny XMLHttpRequest
    var request = new XMLHttpRequest();
    // Requesten görs med GET från vår url, synkad request. Dvs vi väntar ut den.
    request.open("GET", url, false);
    request.send();
    // Vi lagrar svaret i variabeln response
    var response = request.responseXML;
    
    // Därefter gör vi om detta till en list av alla element (egentligen en NodeList, ett slags list-element)
    const scheduleList = response.querySelectorAll('scheduledepisode');

    // Vi tömmer hela inforutan
    document.getElementById("info").replaceChildren();
    
    for(var i=0; i < scheduleList.length; i++){
        // Hämtar titel och beskrivning
        var scheduleTitle = document.createTextNode(scheduleList[i].querySelector("title").textContent);
        var scheduleHeader = document.createElement("h2");
        scheduleHeader.appendChild(scheduleTitle);
        var scheduleDescription = document.createTextNode(scheduleList[i].querySelector("description").textContent);
        var scheduleContent = document.createElement("h3"); 
        scheduleContent.appendChild(scheduleDescription);

        // Hämtar datum
        var scheduleStart = document.createTextNode(scheduleList[i].querySelector("starttimeutc").textContent);
        var scheduleTime = document.createElement("p");
        // Gör om till läsbart datum
        var parsedDate = new Date(scheduleStart.data);
        var formattedDate = parsedDate.toLocaleString();
        var dateTextNode = document.createTextNode(formattedDate);
        scheduleTime.appendChild(dateTextNode);

        // Lägger till data och linje
        document.getElementById("info").appendChild(scheduleHeader);
        document.getElementById("info").appendChild(scheduleContent);
        document.getElementById("info").appendChild(scheduleTime); 
        document.getElementById("info").appendChild(document.createElement("hr"));   
     }
}

// Skapar ljudelement
var audioElement = document.createElement('audio');
audioElement.controls = true;

// Skapa source element
var sourceElement = document.createElement('source');
sourceElement.type = 'audio/mpeg';

// Lägger till ljudkällan till ljudelementet
audioElement.appendChild(sourceElement);

// Lägger till ljudelementet till hemsidan
document.body.appendChild(audioElement);

// Vi kan ladda t.ex P1 som standardkanal men då ljud inte kan spelas innan användaren interagerat med hemsidan kommer ett DOMException att uppstå
//loadChannel("132");


// Sätter upp en event listener som väntar med att köra funktionen tills Document Object Model slutfört att ladda.
document.addEventListener("DOMContentLoaded", function(){ 
    // Hämtar data från SR i JSON format
    let url = baseURL + "channels?size=100&format=json";
    // Startar HTTP GET metoden till SR JSON
    fetch(url, {method: 'GET'})
        // Gör om svaret till text
        .then(response => response.text())
            // Går igenom datan som JSON
            .then(data => {
                var jsonData = JSON.parse( data );
                // För arrayen channels i jsonData
                for(var i=0; i < jsonData.channels.length; i++){
                   document.getElementById("mainnavlist").innerHTML += "<li id='"+jsonData.channels[i].id+"'>"+jsonData.channels[i].name+"</li>";    
                   document.getElementById("searchProgram").innerHTML += "<option value='"+jsonData.channels[i].id+"'>"+jsonData.channels[i].name+"</option>";      
                }
            })
            .catch(error => {
                alert('There was an error '+error);
            });

    //
    // Create eventlistener for click on search program
    document.getElementById('searchbutton').addEventListener("click", function(e){
        // channelId är den valda kanalen (behöver inte vara kanalen som spelas nu)
        var channelId = document.getElementById("searchProgram").value;
        // Om någon trycker på visa tablå kommer funktionen loadTabla() köras som laddar en ny beskrivning
        loadTabla(channelId);
    }) 

    //
    // Create eventlistener for clicks on dynamically created list of channels in mainnavlist
    document.getElementById('mainnavlist').addEventListener("click", function(e){
        // channalId är det alternativ vi klickat på
        var channelId = e.target.id;
        // Om någon trycker på en kanal kommer funktionen loadChannel() köras som laddar en ny kanal med ljud
        loadChannel(channelId);
    })      
    
})// End of DOM content loaded