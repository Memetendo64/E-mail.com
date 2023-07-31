document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);
  load_mailbox('inbox');
});

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function open_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detail-view').style.display = 'block';
    document.querySelector('#email-detail-view').innerHTML = `
      <ul class="list-group">
        <b>From:</b> <span>${email['sender']}</span>
        <b>To: </b><span>${email['recipients']}</span>
        <b>Subject:</b><span>${email['subject']}</span
        <b>Time:</b><span>${email['timestamp']}</span>
        <br/>${email['body']}
      </ul>
    `;

    if (!email['read']) {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ read : true })
      })
    }
    const reply = document.createElement('button');
    reply.className = "btn btn-primary m-2";
    reply.innerHTML = "Reply";
    reply.addEventListener('click', function() {
      compose_email();
      document.querySelector('#compose-recipients').value = email['sender'];
      let subject = email['subject'];
      if (subject.split(" ", 1)[0] != "Re:") {
        subject = "Re: " + subject;
      }
      document.querySelector('#compose-subject').value = subject;

      let body = `
        On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}
      `;
      document.querySelector('#compose-body').value = body;

    });

    document.querySelector('#email-detail-view').appendChild(reply);
    archiveButton = document.createElement('button');
    archiveButton.className = "btn btn-secondary m-1";
    archiveButton.innerHTML = !email['archived'] ? 'Archive' : 'Unarchive';
    archiveButton.addEventListener('click', function() {
      fetch('/emails/' + email['id'], {
        method: 'PUT',
        body: JSON.stringify({ archived : !email['archived'] })
      })
      .then(response => load_mailbox('inbox'))
    });
    document.querySelector('#email-detail-view').appendChild(archiveButton);
  })
  .catch(error => {
    console.log('Error:', error);
  });
}

function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
        let new_email_div = document.createElement('div');
        new_email_div.className = email['read'] ? "email-box-not-read" : "email-box-read"
        new_email_div.innerHTML = `
          <span class="timestamp-email"> ${email['timestamp']} </span>
          <span class="sender-email"> <strong>${email['sender']}</strong> </span>
          <span class="subject-email"> ${email['subject']} </span>
          `
        new_email_div.addEventListener('click', () => open_email(email['id']));
        document.querySelector('#emails-view').appendChild(new_email_div);
      });

  })

  .catch(error => {
    console.log('Error:', error);
  });

}
function send_email(event){
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
  })
  .catch(error => {
    console.log('Error:', error);
  });
  load_mailbox('sent');
}