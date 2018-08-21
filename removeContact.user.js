// ==UserScript==
// @name         Remove Contact API
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Removes Contact for multiple tickets from More dropdown
// @author       Gloria
// @grant        none
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Dashboard*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/TicketTabs*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Tasks*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/KnowledgeBase*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Wiki*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Search*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/WaterCooler*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Calendar*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/User*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Groups*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Customer*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Product*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Inventory*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Asset*
// @exclude      https://app.teamsupport.com/vcr/*/Pages/Report*
// @exclude      https://app.teamsupport.com/vcr/*/TicketPreview*
// @exclude      https://app.teamsupport.com/vcr/*/Images*
// @exclude      https://app.teamsupport.com/vcr/*/images*
// @exclude      https://app.teamsupport.com/vcr/*/Audio*
// @exclude      https://app.teamsupport.com/vcr/*/Css*
// @exclude      https://app.teamsupport.com/vcr/*/Js*
// @exclude      https://app.teamsupport.com/Services*
// @exclude      https://app.teamsupport.com/frontend*
// @exclude      https://app.teamsupport.com/Frames*
// @match        https://app.teamsupport.com/vcr/*


// ==/UserScript==

// constants
var url = "https://app.teamsupport.com/api/xml/";
var orgID = "";
var token = "";

// initialize XMLHttpRequest and DOMParser
var xhr = new XMLHttpRequest();
var parser = new DOMParser();

document.addEventListener('DOMContentLoaded', main(), false);

function createModal(){
    // create Add Contacts modal pop up
    var modal = document.createElement("div");
    modal.className = "modal fade";
    modal.setAttribute("id", "removeContactModal");
    modal.role = "dialog";
    modal.setAttribute("tabindex", -1);
    modal.setAttribute("aria-labelledby", "removeContactModal");
    modal.setAttribute("aria-hidden", true);
    document.body.appendChild(modal);

    var modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog";
    modalDialog.setAttribute("role","document");
    modal.appendChild(modalDialog);

    var modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    modalDialog.appendChild(modalContent);

    //create modal header
    var modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalContent.appendChild(modalHeader);

    // create header title
    var header = document.createElement("h4");
    header.className = "modal-title";
    var hText = document.createTextNode("Remove Contact");
    header.appendChild(hText);
    modalHeader.appendChild(header);

    // create header close button
    var hbutton = document.createElement("button");
    hbutton.setAttribute("type", "button");
    hbutton.className = "close";
    hbutton.setAttribute("data-dismiss", "modal");
    hbutton.setAttribute("aria-label", "Close");
    var span = document.createElement("span");
    span.setAttribute("aria-hidden", true);
    span.innerHTML = "&times;";
    hbutton.appendChild(span);
    header.appendChild(hbutton);

    // create dropdown within modal body
    var modalBody = document.createElement("div");
    modalBody.className="modal-body";
    modalBody.id = "remove-contact-body";
    modalContent.appendChild(modalBody);

    //create modal footer
    var modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalContent.appendChild(modalFooter);

    // create save and close buttons in modal footer
    var sbtn = document.createElement("button");
    var save = document.createTextNode("Remove Contact");
    sbtn.appendChild(save);
    sbtn.id = "save-btn-remove-contact";
    sbtn.type = "button";
    sbtn.setAttribute("data-dismiss", "modal");
    sbtn.className = "btn btn-primary";
    var cbtn = document.createElement("button");
    var close = document.createTextNode("Close");
    cbtn.appendChild(close);
    cbtn.type = "button";
    cbtn.className = "btn btn-secondary";
    cbtn.setAttribute("data-dismiss", "modal");
    modalFooter.appendChild(sbtn);
    modalFooter.appendChild(cbtn);
}

function main(){
    if(document.getElementsByClassName('btn-toolbar').length == 1){
        // create resolve version button in dropdown
        var ul = document.getElementsByClassName("dropdown-menu ticket-menu-actions")[0];
        ul.removeAttribute("aria-expanded");
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.appendChild(document.createTextNode("Remove Contact"));
        a.setAttribute("class", "ticket-action-remove");
        a.setAttribute("href", "#");
        a.setAttribute("data-toggle", "modal");
        a.setAttribute("data-target", "#removeContactModal");
        li.appendChild(a);
        ul.appendChild(li);

        // create initial modal
        createModal();

        //if Add Contact mass button clicked, clear modal contents then replace modal contents appropriately
        a.addEventListener('click', function(e){
            e.preventDefault();
            var sel = document.getElementById('remove-contact-body');
            if(sel) sel.innerHTML = "";
            addContact();
        });
    }
}

function addContact(){
    // get tickets that are selected and parse through the xml to add them to a ticket array
    var tickets = new Array();
    var elements = document.querySelectorAll('[class$="ticket-grid-cell-ticketnumber selected"]');

    var len = elements.length;
    for(var i=0; i<len; ++i){
        var ele = elements[i].innerHTML;
        var ticket = ele.substring(ele.indexOf(">")+1, ele.lastIndexOf("<"));
        tickets.push(ticket);
    }

    var modalBody = document.getElementById("remove-contact-body");

    //create and populate contact dropdown with options from API
    var contdropdown = document.createElement("div");
    contdropdown.className = "form-group";
    contdropdown.setAttribute("disabled", "true");
    var contlabel = document.createElement("label");
    contlabel.setAttribute("for","rcform-select-contact");
    contlabel.innerHTML = "Select a Contact";
    var contselect = document.createElement("select");
    contselect.className = "form-control";
    contselect.setAttribute("id", "rcform-select-contact");

    var contacts = getTicketContacts(tickets[0]);

    //populate contact dropdown
    for(var n=0; n<contacts.id.length; ++n){
        var c = document.createElement("option");
        c.value = contacts.id[n].innerHTML;
        c.text = contacts.firstName[n].innerHTML + " " + contacts.lastName[n].innerHTML;
        console.log(c);
        contselect.appendChild(c);
    }

    contdropdown.appendChild(contlabel);
    contdropdown.appendChild(contselect);
    modalBody.appendChild(contdropdown);
    console.log("created contact dropdown");

    // if Add Contact Save was clicked then send a delete request
    document.getElementById('save-btn-remove-contact').onclick = function saveVersion() {
        updateContact(tickets);
    }
}

function getTicketContacts(ticket){
  if(ticket.length == 0) document.getElementById("rcform-select-contact").innerHTML = "<option></option>";
  var queryURL = url + "Tickets/" + ticket + "/Contacts";
  xhr.open("GET", queryURL, false, orgID, token);
  xhr.send();
  var xmlDoc = parser.parseFromString(xhr.responseText,"text/xml");
  console.log(xmlDoc);
  var id = xmlDoc.getElementsByTagName("ContactID");
  var firstName = xmlDoc.getElementsByTagName("FirstName");
  var lastName = xmlDoc.getElementsByTagName("LastName");

  return {
    id: id,
    firstName: firstName,
    lastName: lastName
  }
}

async function updateContact(tickets){
    var contact = document.getElementById('rcform-select-contact');
    var contactValue = contact.value;
    var len = tickets.length;

    //var data = '<Contact><ContactID>' + contactValue + '</ContactID></Contact>';
    //var xmlData = parser.parseFromString(data,"text/xml");

    // loop through the tickets array and update their contacts
    for(var t=0; t<len; ++t){
        var deleteURL = url + "Tickets/" + tickets[t] + '/Contacts/' + contactValue;
        console.log(deleteURL);
        xhr.open("DELETE", deleteURL, false, orgID, token);
        console.log(xhr.status);
        xhr.send();
        console.log(xhr.status);
    }

    //force reload so website reflects resolved version change
    location.reload();
}
