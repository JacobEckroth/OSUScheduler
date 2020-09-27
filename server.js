var axios = require('axios')
var fs = require('fs');

var exphbs = require("express-handlebars");
var bodyParser = require('body-parser');
var express = require('express')
const puppeteer = require('puppeteer');
const {
    CONNREFUSED
} = require('dns');
const {
    Console
} = require('console');
const jsdom = require('jsdom');
const e = require('express');
const PORT = process.env.PORT || 3000;




var app = express();


app.set('view engine', 'handlebars');
app.use(express.static('public'));
app.use(bodyParser.json({
    limit: '50mb'
}));

app.listen(PORT, function () {
    console.log("listening on port " + PORT); //don't start listening until connected.
})



app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html')

    //getData("https://classes.oregonstate.edu/?keyword=cs290&srcdb=999999&camp=C")

})

app.get("/classRequest/:className/:term/:subject/:campus", function (req, res) {
    var className = req.params.className;
    var term = req.params.term;
    var subject = req.params.subject;
    var campus = req.params.campus;
    var url = "https://classes.oregonstate.edu/?keyword=";
    url += className;
    //WILL HAVE TO UPDATE THIS FOR FUTURE TERMS
    switch (term) {
        case 'any':
            url += '&srcdb=999999';
            break;
        case 'Su':
            url += '&srcdb=202100';
            break;
        case 'Fa':
            url += '&srcdb=202101';
            break;
        case 'Wi':
            url += '&srcdb=202102';
            break;
        case 'Sp':
            url += 'srcdb=202103';
            break;
        default:
            console.log("Weird term:", term);
            break;
    }
    if (subject != 'any') {
        url = url + '&subject=' + subject;
    }
    switch (campus) {
        case 'any':
            break;
        case 'ecampus':
            url += '&camp=D3,DB,DH,DI,DJ,DLP,DN,DP,DT,DZ';
            break;
        case 'corvallis':
            url += '&camp=C';
            break;
        case 'cascades':
            url += '&camp=B';
            break;
    }
    console.log("URL IS:",url);


    test = getData(url,res,term);


})



app.get("*", function (req, res) {
    var fileName = req.url;
    var fileLocation = __dirname + fileName;
    if (fs.existsSync(fileLocation)) {
        res.sendFile(fileLocation);
    } else {
        console.log("page attempted: ")
        console.log(req.url);
        res.status(404);
        res.send('that didnt really work')

        res.sendFile(__dirname + '/index.html')
    }

})

function getData(url,res,term) {
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        await page.waitForSelector('.panel__body') //when this loads I know that the classes are loaded.


        //let bodyHTML =  await page.evaluate(()=>  document.querySelector('.panel__body').innerHTML);
        const optionsArray = await page.evaluate(() => [...document.querySelectorAll('.result')].map(elem => elem.innerHTML));
        if(optionsArray.length> 1){
         optionsArray.pop(); //there's some useless info at the end of the options array.
        }

        // console.log(bodyHTML);
        // res.send(bodyHTML);
        // console.log("DONE")
        await browser.close();
        
        var newData = makeDataUsable(optionsArray,term);
 
        var jsonData = JSON.stringify(newData);
        res.status(200);
        console.log("Sending data");
        res.send(jsonData);
      

    })();
}

function makeDataUsable(arrayOfOptions,term) {

    
    let classData = [];
    for (let i = 0; i < arrayOfOptions.length; i++) {
        let classInfo = {};
        const dom = new jsdom.JSDOM(arrayOfOptions[i]);


        classInfo.crn = Number(dom.window.document.querySelector(".result__link").getAttribute("data-key").substr(4)); //substr removes  the crn: at the beginning of the string.
        // console.log(dom.window.document.querySelector(".sr-only").textContent);
    
        if(term=="any"){
            classInfo.term = (dom.window.document.querySelector(".result__flex--2").textContent).substr(6); //substr 6 because it has TERM: at the beginning
        }else{
            classInfo.term = term;
        }
        classInfo.sectionNumber = (dom.window.document.querySelector(".result__flex--3").textContent).substr(16);
        classInfo.instructor = (dom.window.document.querySelector(".result__flex--9").textContent).substr(12); //you know why this is here
        classInfo.meetingTimeString = (dom.window.document.querySelector(".flex--grow").textContent).substr(7);

        classData.push(classInfo);

    }

    //  console.log(classData);

    classData = fixTimes(classData);
    
    return classData;

}

function fixTimes(classData) { //turns the meeting time from a string into actual data we can use.
    //console.log(classData);

    for (var i = 0; i < classData.length; i++) {
        classData[i].monday = false;
        classData[i].tuesday = false;
        classData[i].wednesday = false;
        classData[i].thursday = false;
        classData[i].friday = false;
        var spaceIndex = classData[i].meetingTimeString.indexOf(' ');

        let classDays = classData[i].meetingTimeString.slice(0, spaceIndex);

        let classTime = classData[i].meetingTimeString.slice(spaceIndex + 1);


        if (classDays.indexOf('M') != -1) {
            classData[i].monday = true;
        }
        if (classDays.indexOf('F') != -1) {
            classData[i].friday = true;
        }
        if (classDays.indexOf('Th') != -1) {
            classData[i].thursday = true;
        }
        if (classDays.indexOf('W') != -1) {
            classData[i].wednesday = true;
        }
        var TNumber = classDays.replace(/[^T]/g, "").length //stolen from here to count the number of T's in a string https://stackoverflow.com/questions/2903542/javascript-how-many-times-a-character-occurs-in-a-string
        if (TNumber == 0) {

        } else if (TNumber == 1) {
            if (classData[i].thursday == false) {
                classData[i].tuesday = true;
            }
        } else {
            classData[i].tuesday = true;
        }
        //now to deal with the class time.
        var dashIndex = classTime.indexOf('-');
        var startTime = classTime.slice(0, dashIndex); //one because there's a stupid space.
        var endTime = classTime.slice(dashIndex + 1);
        if (endTime.indexOf('p') != -1 && startTime.indexOf('a') == -1) { //it begins in the PM.
            classData[i].beginZone = 'p'; //begins in the am
        } else {
            classData[i].beginZone = 'a';
        }
        //setting the start hour and minute.
        if (startTime.indexOf('a') != -1) {
            startTime = startTime.slice(0, startTime.length - 1);
        } //getting rid of an a if there is one.
        if (startTime.indexOf(':') == -1) {
            classData[i].startHour = Number(startTime);
            if (classData[i].beginZone === 'p' && classData[i].startHour != 12) {
                classData[i].startHour += 12;
            }
            classData[i].startMinute = 0;
        } else {
            colonIndex = startTime.indexOf(':');
            classData[i].startHour = Number(startTime.slice(0, colonIndex));
            if (classData[i].beginZone === 'p' && classData[i].startHour != 12) {
                classData[i].startHour += 12;
            }
            classData[i].startMinute = Number(startTime.slice(colonIndex + 1));
        }

        let endZone = endTime[endTime.length - 1];
        endTime = endTime.slice(0, endTime.length - 1);

        if (endTime.indexOf(':') == -1) {
            classData[i].endHour = Number(endTime);
            if (endZone == 'p' && classData[i].endHour != 12) {
                classData[i].endHour += 12;
            }
            classData[i].endMinute = 0;
        } else {
            colonIndex = endTime.indexOf(':');
            classData[i].endHour = Number(endTime.slice(0, colonIndex));
            if (endZone == 'p' && classData[i].endHour != 12) {
                classData[i].endHour += 12;
            }
            classData[i].endMinute = Number(endTime.slice(colonIndex + 1));
        }
    }
    return classData;
}




function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}