submitButton = document.getElementById("addToSchedule");
submitButton.addEventListener("click", addNewClass);

let currentClasses = [];
let classNames = [];






function addNewClass() {
    let url = "/classRequest/" + document.getElementById("className").value + "/" + document.getElementById("termSelector").value + '/' + document.getElementById("subjectSelector").value + '/' + document.getElementById("campusSelector").value;
    var request = new XMLHttpRequest();
    let className = document.getElementById("className").value;
    classNames.push(className);
    request.open('GET', url);
    request.send();
    request.addEventListener('load', function (event) {
        console.log("got response");
        var results = JSON.parse(request.response);

        console.log(results);
        currentClasses.push(results);
        showNewClass();
    });
}



function showNewClass() {
    var classesHolder = document.getElementById("classesHolder");
    var individualHolder = document.createElement("div");
    var className = classNames[classNames.length - 1]
    individualHolder.style.width = "100%";
    individualHolder.style.display = "inline-block";
    individualHolder.style.height = 100 / classNames.length + "%"
    var deleteButton = document.createElement("button");
    deleteButton.type = "button";

    var classNameP = document.createElement("p");
    classNameP.style.display = "inline-block";
    classNameP.classList.add("className");
    classNameP.textContent = className;
    individualHolder.appendChild(classNameP);
    individualHolder.appendChild(deleteButton);
    classesHolder.appendChild(individualHolder);



    deleteButton.id = className + "-deleteButton";
    deleteButton.textContent = "Remove";
    deleteButton.height = "100%";





}


var calendar = document.getElementById("calendar");
//calender stuff here

var dayWidth;
var hourHeight;
var calendarTop;
var calendarLeft;


window.addEventListener("load", setUpCalendarSize);

function setUpCalendarSize() {
    var calendarWidth = calendar.width;
    var calendarHeight = calendar.height;
    calendarTop = calendarHeight * .10;

    calendarLeft = calendarWidth * .10;
    drawCalendarGrid();
}

function drawCalendarGrid() {

    var calendarWidth = calendar.width - calendarLeft;
    var calendarHeight = calendar.height - calendarTop;

    var ctx = calendar.getContext("2d");



    var daysInWeek = 5; //no sat or sun;
    var bigSubSections = 13; //need to draw 13 rectangles to get all times of day.

    dayWidth = Math.floor(calendarWidth / daysInWeek);
    hourHeight = Math.floor(calendarHeight / bigSubSections);
    console.log(dayWidth);
    console.log(hourHeight);
    ctx.setLineDash([5, 10]);

    for (var y = 0; y < bigSubSections; y++) {

        ctx.beginPath();
        ctx.lineWidth = "1";
        ctx.moveTo(calendarLeft, hourHeight / 2 + calendarTop + y * hourHeight)
        ctx.lineTo(calendarWidth + calendarLeft, hourHeight / 2 + calendarTop + y * hourHeight)
        ctx.stroke();





    }

    ctx.setLineDash([]);
    for (var x = 0; x < daysInWeek; x++) { //drawing the main days


        for (var y = 0; y < bigSubSections; y++) {

            ctx.beginPath();
            ctx.lineWidth = "1";
            ctx.rect(calendarLeft + x * dayWidth, calendarTop + y * hourHeight, dayWidth, hourHeight);
            ctx.stroke();





        }
    }
    //writing the hours
    for (var y = 0; y < bigSubSections; y++) {

        ctx.font = "15px Arial"
        var text;
        if (y + 8 > 12) {
            text = y - 4 + ":00"
        } else {
            text = y + 8 + ":00"
        }

        ctx.fillText(text, 0, calendarTop + 5 + hourHeight * y);




    }




    for (var x = 0; x < daysInWeek; x++) {
        ctx.font = "15px Arial"
        var text;
        switch (x) {
            case 0:
                text = "Monday";
                break;
            case 1:
                text = "Tuesday";
                break;
            case 2:
                text = "Wednesday";
                break;
            case 3:
                text = "Thursday";
                break;
            case 4:
                text = "Friday";
                break;
            default:
                console.log("what");
                break;
        }

        ctx.fillText(text, calendarLeft + x * dayWidth, calendarTop - 10);

    }


}

function colorInCalendarSection(startHour, startMinute, endHour, endMinute, day) {
    var startX;

    var ctx = calendar.getContext("2d");

    switch (day) {
        case 'm':
            startX = 0;
            break;
        case 't':
            startX = 1;
            break;
        case 'w':
            startX = 2;
            break;
        case 'th':
            startX = 3;
            break;
        case 'f':
            startX = 4;
            break;
    }
    startX = calendarLeft + startX * dayWidth;

    var startY = calendarTop +  (startHour - 8)*hourHeight; //minus 8 because the calendar starts at 8.
    if(startMinute != 0){
        startY += (startMinute/60) * hourHeight;    //adds that percentage of the hour.

    }
    var width = dayWidth;
    var height = (endHour - startHour) * hourHeight;
    if(endMinute != 0){
        height+= (endMinute/60)*hourHeight;
    }

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "blue";                      //TODO: Change this later.
    ctx.fillRect(startX, startY,width,height);
    ctx.globalAlpha = 1;





}