// WorkHive Category Metadata: Visual thumbnails, icons, and theme accents
export const CATEGORY_META = {
  'Web Development': {
    icon: '💻',
    accent: '#2563eb', // Blue
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
    tag: 'Web & Full Stack',
  },
  'Mobile App Development': {
    icon: '📱',
    accent: '#8b5cf6', // Purple
    gradient: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=80',
    tag: 'iOS & Android',
  },
  'Mobile Apps': {
    icon: '📱',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #581c87 0%, #a855f7 100%)',
    image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=600&q=80',
    tag: 'Mobile Apps',
  },
  'UI/UX Design': {
    icon: '🎨',
    accent: '#ec4899', // Pink
    gradient: 'linear-gradient(135deg, #831843 0%, #f472b6 100%)',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    tag: 'Figma & Product UI',
  },
  'Design & Creative': {
    icon: '🎨',
    accent: '#ec4899',
    gradient: 'linear-gradient(135deg, #831843 0%, #f472b6 100%)',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=600&q=80',
    tag: 'Creative Design',
  },
  'Graphic Design': {
    icon: '🖌️',
    accent: '#f97316', // Orange
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #fb923c 100%)',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80',
    tag: 'Branding & Graphics',
  },
  'Data Analytics': {
    icon: '📊',
    accent: '#06b6d4', // Cyan
    gradient: 'linear-gradient(135deg, #164e63 0%, #22d3ee 100%)',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    tag: 'BI & SQL Analytics',
  },
  'Artificial Intelligence & Machine Learning': {
    icon: '🤖',
    accent: '#6366f1', // Indigo
    gradient: 'linear-gradient(135deg, #312e81 0%, #818cf8 100%)',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    tag: 'LLMs & AI Engineering',
  },
  'AI & Machine Learning': {
    icon: '🤖',
    accent: '#6366f1',
    gradient: 'linear-gradient(135deg, #312e81 0%, #818cf8 100%)',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80',
    tag: 'AI & Data Science',
  },
  'Content Writing': {
    icon: '✍️',
    accent: '#eab308', // Amber
    gradient: 'linear-gradient(135deg, #713f12 0%, #facc15 100%)',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
    tag: 'Technical Copywriting',
  },
  'Writing & Translation': {
    icon: '✍️',
    accent: '#eab308',
    gradient: 'linear-gradient(135deg, #713f12 0%, #facc15 100%)',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80',
    tag: 'Writing & Translation',
  },
  'Digital Marketing': {
    icon: '📈',
    accent: '#10b981', // Emerald
    gradient: 'linear-gradient(135deg, #064e3b 0%, #34d399 100%)',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    tag: 'SEO & Growth Ads',
  },
  'DevOps & Cloud': {
    icon: '☁️',
    accent: '#0284c7', // Sky
    gradient: 'linear-gradient(135deg, #082f49 0%, #38bdf8 100%)',
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=600&q=80',
    tag: 'AWS & Kubernetes',
  },
  'Video Editing': {
    icon: '🎬',
    accent: '#f43f5e', // Rose
    gradient: 'linear-gradient(135deg, #881337 0%, #fb7185 100%)',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
    tag: 'Premiere & Motion',
  },
  Other: {
    icon: '💼',
    accent: '#64748b', // Slate
    gradient: 'linear-gradient(135deg, #1e293b 0%, #64748b 100%)',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    tag: 'Professional Services',
  },
};

export const getCategoryMeta = (category) => {
  return CATEGORY_META[category] || CATEGORY_META['Other'];
};

