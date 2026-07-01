import dns from 'dns';

dns.resolve4('google.com', (err, addresses) => {
  if (err) {
    console.error("DNS Resolution for google.com failed:", err);
  } else {
    console.log("DNS Resolution for google.com succeeded:", addresses);
  }
});

dns.resolve4('eekehhgzmjmsymmtumgd.supabase.co', (err, addresses) => {
  if (err) {
    console.error("DNS Resolution for eekehhgzmjmsymmtumgd.supabase.co failed:", err);
  } else {
    console.log("DNS Resolution for eekehhgzmjmsymmtumgd.supabase.co succeeded:", addresses);
  }
});
