(function () {
  function handleTeamInvite() {
    var q = new URLSearchParams(location.search);
    var teamId = q.get('teamId') || 'default';
    var inviteId = q.get('inviteId') || '';
    var method = q.get('method') === '1' ? 'PUT' : 'GET';
    fetch('/api/v2/teams/' + teamId + '/invites/' + inviteId, {
      method: method,
      credentials: 'include',
      headers: { 'X-CSRF-Token': window.__csrf },
    });
  }
  window.handleTeamInvite = handleTeamInvite;
  if (new URLSearchParams(location.search).get('action') === 'team-invite') handleTeamInvite();
})();
