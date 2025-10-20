db.createUser({
  user: 'petcare_app',
  pwd: 'petcare_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'petcare'
    }
  ]
});
