<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

// Returns AVL tree for the authenticated user's projects
// GET parameters:
//  key=priority|due_date|start_date|title (default: priority)
//  form=nested|flat (nested default) - nested returns tree with left/right as nested objects

try {
    $userId = requireAuth();
    $pdo = getPDO();

    $key = $_GET['key'] ?? 'priority';
    $allowedKeys = ['priority','due_date','start_date','title'];
    if (!in_array($key, $allowedKeys)) $key = 'priority';

    $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ?");
    $stmt->execute([$userId]);
    $projects = $stmt->fetchAll();

    // Helper to compute key value for comparison
    $getKeyVal = function($proj) use ($key) {
        if ($key === 'priority') return (int)($proj['priority'] ?? 0);
        if ($key === 'title') return strtolower($proj['title'] ?? '');
        // dates -> timestamp
        return strtotime($proj[$key] ?? '1970-01-01');
    };

    // AVL implementation
    class AVLNode {
        public $id; public $key; public $title; public $left; public $right; public $height;
        public function __construct($id, $key, $title) {
            $this->id = (int)$id; $this->key = $key; $this->title = $title; $this->left = null; $this->right = null; $this->height = 1;
        }
    }

    class AVLTreePHP {
        private $root = null;
        private $getVal;
        public function __construct($getVal) { $this->getVal = $getVal; }
        private function height($n) { return $n ? $n->height : 0; }
        private function balance($n) { return $this->height($n->left) - $this->height($n->right); }
        private function rotateRight($y) {
            $x = $y->left; $T2 = $x->right;
            $x->right = $y; $y->left = $T2;
            $y->height = 1 + max($this->height($y->left), $this->height($y->right));
            $x->height = 1 + max($this->height($x->left), $this->height($x->right));
            return $x;
        }
        private function rotateLeft($x) {
            $y = $x->right; $T2 = $y->left;
            $y->left = $x; $x->right = $T2;
            $x->height = 1 + max($this->height($x->left), $this->height($x->right));
            $y->height = 1 + max($this->height($y->left), $this->height($y->right));
            return $y;
        }
        private function cmp($a, $b) {
            // handle strings & numbers
            if (is_numeric($a) && is_numeric($b)) return $a - $b;
            return strcmp((string)$a, (string)$b);
        }
        private function insertNode($node, $proj) {
            if (!$node) return new AVLNode($proj['id'], ($this->getVal)($proj), $proj['title']);
            $val = ($this->getVal)($proj);
            $cmp = $this->cmp($val, $node->key);
            if ($cmp < 0) $node->left = $this->insertNode($node->left, $proj);
            else if ($cmp > 0) $node->right = $this->insertNode($node->right, $proj);
            else {
                // tie-break by title
                if (strcasecmp($proj['title'], $node->title) < 0) $node->left = $this->insertNode($node->left, $proj);
                else $node->right = $this->insertNode($node->right, $proj);
            }
            $node->height = 1 + max($this->height($node->left), $this->height($node->right));
            $bal = $this->balance($node);
            if ($bal > 1 && $this->cmp(($this->getVal)($proj), $node->left->key) < 0) return $this->rotateRight($node);
            if ($bal < -1 && $this->cmp(($this->getVal)($proj), $node->right->key) > 0) return $this->rotateLeft($node);
            if ($bal > 1 && $this->cmp(($this->getVal)($proj), $node->left->key) > 0) { $node->left = $this->rotateLeft($node->left); return $this->rotateRight($node); }
            if ($bal < -1 && $this->cmp(($this->getVal)($proj), $node->right->key) < 0) { $node->right = $this->rotateRight($node->right); return $this->rotateLeft($node); }
            return $node;
        }
        public function add($proj) { $this->root = $this->insertNode($this->root, $proj); }
        public function getRoot() { return $this->root; }
        public function inorder($node=null, &$arr=null) {
            if ($arr === null) $arr = [];
            if ($node === null) $node = $this->root;
            if (!$node) return $arr;
            $this->inorder($node->left, $arr);
            $arr[] = ['id'=>$node->id,'key'=>$node->key,'title'=>$node->title];
            $this->inorder($node->right, $arr);
            return $arr;
        }
    }

    $tree = new AVLTreePHP($getKeyVal);
    foreach ($projects as $p) $tree->add($p);

    $form = $_GET['form'] ?? 'nested';
    if ($form === 'flat') {
        $in = $tree->inorder();
        jsonResponse(true, ['inorder' => $in], 'OK', 200);
    }

    // Convert tree->root to nested arrays
    function nodeToArray($n) {
        if (!$n) return null;
        return [
            'id' => $n->id,
            'key' => $n->key,
            'title' => $n->title,
            'height' => $n->height,
            'left' => nodeToArray($n->left),
            'right' => nodeToArray($n->right),
        ];
    }

    $root = $tree->getRoot();
    $out = ['tree' => nodeToArray($root), 'inorder' => $tree->inorder()];
    jsonResponse(true, $out, 'OK', 200);

} catch (Exception $ex) {
    sendServerError($ex->getMessage());
}

?>
