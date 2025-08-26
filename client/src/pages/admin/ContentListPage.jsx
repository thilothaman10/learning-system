import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Video, 
  Headphones, 
  Image, 
  Link as LinkIcon,
  Search,
  Filter
} from 'lucide-react';
import { Card, Badge, Button, Input } from '../../components/ui';
import { useContent } from '../../hooks/useApi';
import toast from 'react-hot-toast';

const ContentListPage = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { getAllContent, deleteContent } = useContent();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Pass admin=true to get all content
      const contentData = await getAllContent({ admin: true });
      console.log('Fetched content:', contentData);
      
      // Handle the response structure
      if (contentData && Array.isArray(contentData)) {
        setContent(contentData);
      } else if (contentData && Array.isArray(contentData.content)) {
        setContent(contentData.content);
      } else {
        setContent([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
      // Fallback to empty array
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContent(contentId);
        toast.success('Content deleted successfully');
        fetchContent();
      } catch (error) {
        toast.error('Failed to delete content');
      }
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-red-600" />;
      case 'audio':
        return <Headphones className="h-5 w-5 text-blue-600" />;
      case 'document':
        return <FileText className="h-5 w-5 text-green-600" />;
      case 'image':
        return <Image className="h-5 w-5 text-purple-600" />;
      case 'text':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
              <p className="text-gray-600 mt-1">Manage all training content</p>
            </div>
            <Link to="/admin/content/create">
              <Button variant="primary" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Content
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <Card.Content>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="link">Link</option>
                </select>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Content List */}
        {filteredContent.length === 0 ? (
          <Card>
            <Card.Content className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No content found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first piece of content'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Link to="/admin/content/create">
                  <Button variant="primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                </Link>
              )}
            </Card.Content>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredContent.map((item) => (
              <Card key={item._id}>
                <Card.Content>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getContentIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {item.title}
                          </h3>
                          <Badge variant={item.isPublished ? 'success' : 'warning'}>
                            {item.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                          <Badge variant="secondary">
                            {getTypeLabel(item.type)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                                                 <div className="flex items-center space-x-4 text-sm text-gray-500">
                           <span>Course: {item.course?.title}</span>
                           {item.duration && <span>Duration: {item.duration} min</span>}
                           <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link to={`/admin/content/edit/${item._id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentListPage;
