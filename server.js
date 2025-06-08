require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
);

// Delete a user from Supabase Auth
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// Update a user's email or password in Supabase Auth
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.admin.updateUserById(id, {
    email,
    password,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));