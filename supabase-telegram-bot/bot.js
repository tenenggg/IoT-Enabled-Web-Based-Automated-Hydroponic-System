const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

// Replace these with your actual values
const SUPABASE_URL = 'https://nshoxougnzhvtxvyyskq.supabase.co';
const SUPABASE_ANON_KEY = 'your supabase anon key';
const TELEGRAM_BOT_TOKEN = '7your telegram bot token';
const TELEGRAM_CHAT_ID = 'your telegram chat id';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Track current alert state
let currentAlerts = {
  ph_above: false,
  ph_below: false,
  ec_above: false,
  ec_below: false
};

async function checkAndNotify() {
  try {// Get only the most recent row
    const { data: sensorData, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) {
      console.error('Supabase error:', error);
      return;}
    if (sensorData && sensorData.length > 0) {
      const row = sensorData[0];   // Check if any alert conditions have changed
      const newAlerts = {
        ph_above: row.ph_above || false,
        ph_below: row.ph_below || false,
        ec_above: row.ec_above || false,
        ec_below: row.ec_below || false };
      
      if (JSON.stringify(currentAlerts) !== JSON.stringify(newAlerts)) { // Only send message if alert state has changed
        let message = '';
        if (newAlerts.ph_above) message += `ph too high, need to add acidic solution ! activate pump 2 ${row.plant_profile_name} (pH: ${row.ph})\n\n`;
        if (newAlerts.ph_below) message += `ph too low, need to add alkali solution ! activate pump 1 ${row.plant_profile_name} (pH: ${row.ph})\n\n`;
        if (newAlerts.ec_above) message += `ec too high, need to add water ! activate water pump ${row.plant_profile_name} (EC: ${row.ec})\n\n`;
        if (newAlerts.ec_below) message += `ec too low, need to add solution A+B ! activate pump 3 ${row.plant_profile_name} (EC: ${row.ec})\n\n`;
        if (message) {
          await bot.sendMessage(TELEGRAM_CHAT_ID, message).catch(console.error);
          console.log('Sent alert:', message);
        }
        // Update current alert state
        currentAlerts = newAlerts;
      }}}
       catch (err) {
    console.error('Unexpected error:', err);  }}
checkAndNotify();
// Check every 1 seconds to match the Arduino's data collection frequency
setInterval(checkAndNotify, 1000);

// /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to Hydroponic Monitoring Bot! This bot can show you the current values of Electrical Conductivity (EC), pH Level, Water Temperature and will send you alerts when any of the  pump is activated. Oh, and it can also show you the optimised level for all plant profiles.");
});

// /ph command
bot.onText(/\/ph/, async (msg) => {
  const { data, error } = await supabase
    .from('sensor_data')
    .select('ph')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    bot.sendMessage(msg.chat.id, "Could not fetch pH value.");
  } else {
    bot.sendMessage(msg.chat.id, `Current pH value: ${data[0].ph}`);
  }});
bot.onText(/\/ec/, async (msg) => {  // /ec command
  const { data, error } = await supabase
    .from('sensor_data')
    .select('ec')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    bot.sendMessage(msg.chat.id, "Could not fetch EC value.");
  } else {
    bot.sendMessage(msg.chat.id, `Current EC value: ${data[0].ec}`);
  }});
bot.onText(/\/temp/, async (msg) => {    // /temp command
  const { data, error } = await supabase
    .from('sensor_data')
    .select('water_temperature')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    bot.sendMessage(msg.chat.id, "Could not fetch water temperature.");
  } else {
    bot.sendMessage(msg.chat.id, `Current water temperature: ${data[0].water_temperature}°C`);
  }});
bot.onText(/\/plant/, async (msg) => {     // /plant command - list all plant profiles and their ranges
  const { data: plantProfiles, error } = await supabase
    .from('plant_profiles')
    .select('name, ph_min, ph_max, ec_min, ec_max');
  if (error || !plantProfiles || plantProfiles.length === 0) {
    bot.sendMessage(msg.chat.id, "Could not fetch plant profiles.");
    return;}
  let message = "Plant Profiles and Optimum Ranges:\n\n";
  plantProfiles.forEach(plant => {
    message += `🌱 ${plant.name}\n`;
    message += `  pH: ${plant.ph_min} - ${plant.ph_max}\n`;
    message += `  EC: ${plant.ec_min} - ${plant.ec_max}\n\n`;
  });
  bot.sendMessage(msg.chat.id, message);
});
