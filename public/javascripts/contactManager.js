$(function() {

  var contactManager = {

    createAddContactForm: function() {
      $('aside').html($('#addContactScript').html());
      $('aside').attr('id', 'addContact');
      $('#addContact h3').text('Add Contact');
    },

    createEditContactForm: function() {
      $('aside').html($('#addContactScript').html());
      $('#addContact').attr('id', 'updateContact');
      $('#updateContact h3').text('Edit Contact');
      this.switchScreens();
    },

    generateContactList: function() {
      var contactsTempFunc = Handlebars.compile($('#profileTemplate').html());
      $('#listOfContacts').html(contactsTempFunc({contacts: this.contactList}));
    },

    //Buttons
    btnAddContact: function() {
      $('button[name=addContact]').on('click', function(e) {
        e.preventDefault();
        this.createAddContactForm();
        this.switchScreens();
        this.btnCancelUpdateAdd();
        request.addContact();
      }.bind(this))
    },

    btnEditContact: function(){
      $('#listOfContacts').on('click', 'button[name=edit]', function(e) {
        e.preventDefault();
        var fullName = $(e.target).parent('div').find('h5[name=fullName]').text();
        var phone = $(e.target).parent('div').find('dd[name=phone]').text();
        var email = $(e.target).parent('div').find('dd[name=email]').text();
        var tags = [];
        $(e.target).parent('div').find('dd[name=tags]').each(function() {
          tags.push($(this).text());
        });
        this.createEditContactForm();
        var name = $('input[name=fullName]').val(fullName);
        $('input[name=phone]').val(phone);
        $('input[name=email]').val(email);
        $('input[name=tags]').val(tags.join(', '))
        this.btnCancelUpdateAdd();
        request.updateContact($(name).val());
      }.bind(this))
    },

    btnDeleteContact: function() {
      $('#listOfContacts').on('click', 'button[name=delete]', function(e){
        e.preventDefault();
        $('#deleteAlert').show();
        this.btnCancelDelete();
        request.deleteContact($(e.target));
      }.bind(this))
    },

    btnResetTags: function() {
      $('button[name=resetTags]').on('click', function(e) {
        e.preventDefault();
        request.listContacts();
      }.bind(this))
    },

    btnCancelUpdateAdd: function() {
      $('aside button[name=cancel]').on('click', function(e) {
        e.preventDefault();
        this.switchScreens();
      }.bind(this))
    },

    btnCancelDelete: function() {
      $('#deleteAlert button[name=cancel]').on('click', function(e) {
        e.preventDefault();
        $('#deleteAlert').hide();
      })
    },

    //other handlers
    switchScreens: function() {
      $('#default').slideToggle();
      $('aside').slideToggle();
    },

    search: function() {
      $('input[name=search]').on('keyup', function(e) {
        var searchText = $(e.target).val();
        if (searchText === '') {
          request.listContacts();
        } else {
          $('#listOfContacts div').each(function() {
            var name = $(this).find('h5[name=fullName]').text().toLowerCase();
            if (name.includes(searchText)) {
              $(this).show()
            } else {
              $(this).hide();
            }
          })
        }
      }.bind(this));
    },

    filterTags: function() {
      $('#listOfContacts').on('click', 'dd[name=tags]', function(e) {
        e.preventDefault();
        var tagValue = $(e.target).text();
        $('#listOfContacts div').each(function(idx, e) {
          if ($(e).find('dd[name=tags]').text().includes(tagValue)) {
          } else {
            $(this).hide();
          }
        })
      })
    },

    //starter
    init: function() {
      request.listContacts();
      this.btnAddContact();
      this.search();
      this.btnEditContact();
      this.btnDeleteContact();
      this.filterTags();
      this.btnResetTags();
    },
  };

var request = {

    create: function(method, data='', id='') {
      var request = new XMLHttpRequest();
      request.open(method, 'http://localhost:3000/api/contacts/' + id);
      if (method === 'POST' || method === 'PUT') {
        request.setRequestHeader('Content-type', 'application/json');
      } else {
        request.responseType = 'json';
      }
      if (data) {
        request.send(data);
      } else {
        request.send();
      }
      return request;
    },

    load: function(request, eventContact='') {
      request.addEventListener('load', function() {
        if (request.status >= 200 && request.status <= 204) {
          if (request.status === 204) {
            $('#deleteAlert').hide();
            this.listContacts();              
          } else {
            contactManager.switchScreens();
            this.listContacts();              
          }
        } else {
          alert('The server could not process your request.');
        }
      }.bind(this))
    },

    listContacts: function() {
      var requestContacts = this.create('GET')
      requestContacts.addEventListener('load', function() {
        if (requestContacts.status === 200) {
          contactManager.contactList = requestContacts.response
          contactManager.contactList.forEach(function(element) {
            if (element.tags){
              element.tags = element.tags.split(',');
            }
          })
          contactManager.generateContactList();
        }
        if (contactManager.contactList.length > 0) {
          $('#noContacts').hide();
        } else {
          $('#noContacts').show();
        }
      }.bind(this));
    },

    addContact: function(){
      $('#addContact button[name=submit]').on('click', function(e) {
        e.preventDefault();
        if (contact.checkInputs()) {
          //Collect Inputs
          contact.obtainInputValues();
          //Serialize Data
          var jsonProfile = JSON.stringify(contact.contactValues);
          //Send the Request with Data
          var requestSaveContact = this.create('POST', jsonProfile)
          //Listen to Request
          this.load(requestSaveContact);
        };
      }.bind(this))
    },

    updateContact: function(name) {
      $('#updateContact button[name=submit]').on('click', function(e) {
        e.preventDefault();
        if (contact.checkInputs()) {
          contact.obtainInputValues();
          var id;
          contactManager.contactList.forEach(function(obj) {
            if(obj['full_name'] === name) {
              id = obj.id;
            }
          }.bind(this));
          var jsonProfile = JSON.stringify(contact.contactValues);
          var requestUpdateContact = this.create('PUT', jsonProfile, id)
          this.load(requestUpdateContact);
        }
      }.bind(this))
    },

    deleteContact: function(eventContact) {
      $('#deleteAlert').on('click', 'button[name=delete]', function(e) {
        e.preventDefault();
        var id = contact.obtainContactId(eventContact);
        if(id) {
          var requestDeleteContact = this.create('DELETE', id, id)
          this.load(requestDeleteContact, eventContact.parent('div'));
        }
      }.bind(this))
    },
  }

  var contact = {

    contactValues: {},

    checkInputs: function(){
      var pass = true;
      $('.required').each(function(idx, element) {
        if ($(element).val() === '') {
          $(element).addClass('alertInput');
          $(element).closest('li').addClass('alertLabel');
          var newE = document.createElement('p')
          var newT = document.createTextNode('Please enter the ' + element.type + ' field.');
          newE.append(newT);
          $(newE).addClass('alertMessage');
          $(element).parent().append(newE);
          pass = false;
        } else {
          $(element).removeClass('alertInput');
          $(element).closest('li').removeClass('alertLabel');
          $(element).siblings('p').remove();
        }
      })
      return pass;
    },

    obtainContactId: function(eventContact) {
      var fullName = eventContact.parent('div').find('h5[name=fullName]').text();
      var id;
      contactManager.contactList.forEach(function(obj) {
        if (fullName === obj.full_name) {
          id = obj.id;
        }
      })
      return id;
    },

    obtainInputValues: function() {
      this.contactValues['full_name'] = $('input[name=fullName]').val();
      this.contactValues['email'] = $('input[name=email]').val();
      this.contactValues['phone_number'] = $('input[name=phone]').val();
      var tags = $('input[name=tags]').val();
      this.contactValues['tags'] = tags.trim().replace(/\s/g, '_').replace(/\W/g, '').split('_').join(',');
    },

  }


  contactManager.init();

})




