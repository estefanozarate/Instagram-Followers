(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const SKIP_VERIFIED = false;

  const userId = document.cookie.match(/ds_user_id=(\d+)/)?.[1];
  if (!userId) return console.error('No hay sesión iniciada en instagram.com');

  const fetchAll = async (type) => {
    const users = [];
    let maxId = '';
    do {
      const url = `https://www.instagram.com/api/v1/friendships/${userId}/${type}/?count=50` +
                  (maxId ? `&max_id=${maxId}` : '');
      const res = await fetch(url, {
        credentials: 'include',
        headers: { 'x-ig-app-id': '936619743392459' },
      });
      if (!res.ok) throw new Error(`${type}: HTTP ${res.status} (si es 429, espera unos minutos)`);
      const data = await res.json();
      users.push(...data.users);
      maxId = data.next_max_id || '';
      console.log(`${type}: ${users.length} cargados...`);
      await sleep(1200 + Math.random() * 1200); 
    } while (maxId);
    return users;
  };

  const followers = await fetchAll('followers');
  const following = await fetchAll('following');

  const followerIds = new Set(followers.map(u => u.pk));
  let result = following.filter(u => !followerIds.has(u.pk));
  if (SKIP_VERIFIED) result = result.filter(u => !u.is_verified);

  console.log(`Sigues a ${following.length} | Te siguen ${followers.length} | No te siguen de vuelta: ${result.length}`);
  console.table(result.map(u => ({
    usuario: u.username,
    nombre: u.full_name,
    verificado: u.is_verified,
    privado: u.is_private,
    perfil: `https://instagram.com/${u.username}`,
  })));

  // Descarga CSV
  const csv = 'usuario,nombre,verificado,privado,perfil\n' + result.map(u =>
    [u.username, `"${(u.full_name || '').replace(/"/g, '""')}"`, u.is_verified, u.is_private,
     `https://instagram.com/${u.username}`].join(',')
  ).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'no_me_siguen.csv';
  a.click();

  window.noMeSiguen = result;
})();
