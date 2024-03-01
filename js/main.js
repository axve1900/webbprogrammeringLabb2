// Tar bort unsafe features
"use strict";

// Deklarerar baseURL
const baseURL = "https://api.sr.se/api/v2/";

// Skapar funktion som utför requests
function requestXML(url) {
    // Skapar en ny XMLHttpRequest
    var request = new XMLHttpRequest();

    // Requesten görs med GET från vår url, synkad request. Dvs vi väntar ut den.
    request.open("GET", url, false);
    request.send();

    // Slutligen returnerar vi svaret
    return request.responseXML;
}

// Vi skapar en funktion som laddar en ny beskrivning och musik
function loadChannel(channelId) {
    // Hämtar data från SR i XML format för given kanal
    var response = requestXML(baseURL + "channels/" + channelId);
    
    // Ur response plockar vi själva kanalen ur XML datan (deklareras som const mest för att det är 'permanent' data)
    const channelElement = response.querySelector("channel");

    // Skapar Header med namn
    let channelName = document.createTextNode(channelElement.getAttribute("name"));
    let channelHeader = document.createElement("h2"); 
    channelHeader.appendChild(channelName);

    // Skapar Header med namn
    let channelTagline = document.createTextNode(channelElement.querySelector("tagline").textContent);
    let channelContent = document.createElement("h3"); 
    channelContent.appendChild(channelTagline);

    // Ersätter nuvarande kanalinfo
    document.getElementById("info").replaceChildren(channelHeader, channelContent, document.createElement("hr"));

    // Hämtar det som spelas nu
    var response = requestXML(baseURL + "playlists/rightnow?channelid=" + channelId);

    // Ur response plockar vi det som spelas nu
    const playlist = response.querySelector("playlist");

    // Vi skapar föregående och ny song
    var previoussong = playlist.querySelector("previoussong");
    var lastsong = document.createTextNode("Föregående: " + previoussong.querySelector("description").textContent);
    var currentsong = playlist.querySelector("song");
    var newsong = document.createTextNode("Kommande: " + currentsong.querySelector("description").textContent);

    // Lägger till dessa och ett nytt br element till p
    var p = document.createElement("p"); 
    p.appendChild(lastsong);
    p.appendChild(document.createElement("br"));
    p.appendChild(newsong);

    // Sen lägger vi till detta till inforutan
    document.getElementById("info").appendChild(p);


    // Slutligen ersätter vi nuvarande ljudkälla
    audioElement.src = 'http://sverigesradio.se/topsy/direkt/' + channelId + '-hi.mp3';
    audioElement.play();
}

// Vi skapar en funktion som laddar en ny tablå men inte laddar in nytt ljud
function loadTabla(channelId) {
    // deklarerar day (dagens datum) som en const
    const day = new Date().toISOString().split('T')[0];

    // Hämtar alla program i dagens tablå (enligt dokumentation borde '&size=200' inte behövas, men utan denna hämtas bara en del av dagens tablå)
    var response = requestXML(baseURL + "scheduledepisodes?channelid=" + channelId + "&date=" + day + "&size=200");
    
    // Därefter gör vi om detta till en list av alla element (egentligen en NodeList, ett slags list-element)
    const scheduleList = response.querySelectorAll('scheduledepisode');

    // Vi tömmer hela inforutan
    document.getElementById("info").replaceChildren();
    
    for(var i=0; i < scheduleList.length; i++){
        // Hämtar titel och beskrivning
        let scheduleTitle = document.createTextNode(scheduleList[i].querySelector("title").textContent);
        let scheduleHeader = document.createElement("h2");
        scheduleHeader.appendChild(scheduleTitle);
        let scheduleDescription = document.createTextNode(scheduleList[i].querySelector("description").textContent);
        let scheduleContent = document.createElement("h3"); 
        scheduleContent.appendChild(scheduleDescription);

        // Tar ut starttid
        let scheduleStart = document.createTextNode(scheduleList[i].querySelector("starttimeutc").textContent);
        // Gör om till läsbart datum
        let formattedDate = new Date(scheduleStart.data).toLocaleString();
        // Gör om detta till en 'node'
        let dateTextNode = document.createTextNode(formattedDate);
        // Lägger till node till p element
        let scheduleTime = document.createElement("p");
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