Messages = new Meteor.Collection('messages');
Agencies = new Meteor.Collection('agencies');


var testAgencies = [
  {name: 'Red Cross'},
  {name: 'Save the Children'}
];

var testMessagesGenerator = {
  'verbs' : ['need', 'request for', 'complaint about', 'poor quality'],
  'things' : ['water', 'food', 'shelter', 'blankets'],
  'locations' : ['tacloban', 'manila', 'cebu', 'boracay']
};

var categories = ['water', 'food', 'shelter', 'complaint'];


if (Meteor.isClient) {
  
  Template.main.openMessages = function() {
    return Messages.find({status: {$in: ['inprogress', 'new']}});
  }

  Template.main.doneMessages = function() {
    return Messages.find({status: 'done'});
  }

  Template.main.events = {
    'click tr.message' : function(evt) {
      // NB: this has to account for multiple clients to avoid people working on the same ticket
      var msgId = this._id;

      // Unset the previous inprogress message
      var prevMsg = Messages.findOne(Session.get('currentMessageId'));
      if (prevMsg && prevMsg.status == 'inprogress') {
        Messages.update(prevMsg._id, {$set: {status: 'new'}});
      }
      
      // Update the current
      Session.set('currentMessageId', msgId);
      Messages.update(msgId, {$set: {status: 'inprogress'}});
    }
  };

  Template.main.helpers({
    'currentMsgClass' : function(msg) {
      return this._id == Session.get('currentMessageId') ? 'current-msg' : '';
    }
  })

  Template.currentMessage.message = function() {
    return Messages.findOne(Session.get('currentMessageId'));
  }

  Template.currentMessage.events = {
    'submit form' : function(evt) {
      var form = $(evt.target).closest('form');
      var obj = {};
      $.each(form.serializeArray(), function() {
        obj[this.name] = this.value;
      });

      // Set done and write the blob to the current ticket
      Messages.update(Session.get('currentMessageId'), {$set: {details: obj, status: 'done'}});

      // Move to next message
      var nextMsg = Messages.findOne({status: 'new'});
      if (nextMsg) {
        console.log('ere');
        Session.set('currentMessageId', nextMsg._id);
        Messages.update(nextMsg._id, {$set: {status: 'inprogress'}});
      }

      return false;
    }

  }

  Template.currentMessage.allCategories = function() { return categories };

  Template.debug.events({
    'click .msgGen' : function() {
      var msg = {};
      msg['body'] = testMessagesGenerator['verbs'][_.random(0,3)] + ' ' + testMessagesGenerator['things'][_.random(0,3)] + ' in ' + testMessagesGenerator['locations'][_.random(0,3)];
      msg['callback'] = '0917' + _.random(0,999999);
      msg['received'] = _.random(0,999);
      msg['status'] = 'new';
      Messages.insert(msg);
    },
    'click .msgClear' : function() {
      Messages.find().forEach(function(m) {Messages.remove(m._id)});
    }
  })


  Template.agencyAutoComplete.settings = function() {
  return {
   position: "top",
   limit: 5,
   rules: [
     {  
        token: "@",
        collection: Agencies,
        field: "name",
        template: Template.autoCompletePill
     }
   ]
  }
};


}

if (Meteor.isServer) {
  Meteor.startup(function () {
    var agencies = Agencies.find();
    if (agencies.count() == 0) {
      _.each(testAgencies, function(agency) {
        Agencies.insert(agency);
      });
    }
  });
}
