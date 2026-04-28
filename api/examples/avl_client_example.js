// Example client-side adapter to fetch AVL JSON and log nodes
// Usage: include or run in browser console on same origin

async function fetchAVL(key = 'priority') {
  const res = await fetch(`/api/projects_avl.php?key=${encodeURIComponent(key)}`, { credentials: 'include' });
  const json = await res.json();
  if (!json.success) {
    console.error('Error fetching AVL', json.error);
    return;
  }
  console.log('AVL nested tree:', json.data.tree);
  console.log('In-order list:', json.data.inorder);
  return json.data;
}

// Example: draw simple list of node titles in order
function renderInorderList(container, inorder) {
  container.innerHTML = '';
  inorder.forEach((n) => {
    const li = document.createElement('div');
    li.textContent = `${n.id} — ${n.title} (key=${n.key})`;
    container.appendChild(li);
  });
}

export { fetchAVL, renderInorderList };
