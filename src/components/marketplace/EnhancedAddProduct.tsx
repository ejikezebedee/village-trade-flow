import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  Save, 
  Sparkles, 
  Package,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface AddProductFormProps {
  onClose: () => void;
  onProductAdded: () => void;
}

export function EnhancedAddProduct({ onClose, onProductAdded }: AddProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [autoCategory, setAutoCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    unit_type: 'piece',
    category: ''
  });
  const { toast } = useToast();

  const predictCategory = (name: string, description: string) => {
    const text = (name + ' ' + description).toLowerCase();
    
    if (text.match(/tomato|carrot|onion|potato|lettuce|cabbage|vegetable/)) {
      return 'vegetables';
    } else if (text.match(/apple|banana|orange|mango|berry|fruit/)) {
      return 'fruits';
    } else if (text.match(/basket|pottery|handmade|craft|woven|handcraft/)) {
      return 'crafts';
    } else if (text.match(/honey|jam|sauce|oil|food|edible/)) {
      return 'food';
    } else if (text.match(/rice|wheat|corn|grain|cereal/)) {
      return 'grains';
    }
    return 'other';
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Auto-predict category when name or description changes
    if (field === 'name' || field === 'description') {
      const predicted = predictCategory(newFormData.name, newFormData.description);
      setAutoCategory(predicted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        seller_id: profile.id,
        category: formData.category || autoCategory || 'other',
        is_active: true
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Product added successfully!",
        description: `${formData.name} has been added with auto-category: ${productData.category}`,
      });

      onProductAdded();
      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add New Product
          <Badge variant="secondary" className="ml-2">
            <Sparkles className="h-3 w-3 mr-1" />
            Auto-Categorization
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productName">Product Name *</Label>
              <Input 
                id="productName" 
                placeholder="Enter product name..." 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="space-y-2">
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-detected or select manually" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="vegetables">🥕 Vegetables</SelectItem>
                    <SelectItem value="fruits">🍎 Fruits</SelectItem>
                    <SelectItem value="crafts">🧺 Crafts</SelectItem>
                    <SelectItem value="food">🍯 Food</SelectItem>
                    <SelectItem value="grains">🌾 Grains</SelectItem>
                    <SelectItem value="other">📦 Other</SelectItem>
                  </SelectContent>
                </Select>
                {autoCategory && !formData.category && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">
                      Auto-detected: 
                      <Badge variant="outline" className="ml-1">
                        {autoCategory}
                      </Badge>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input 
                id="stock" 
                type="number" 
                placeholder="0" 
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                required
              />
              {parseInt(formData.stock_quantity) <= 5 && formData.stock_quantity && (
                <div className="flex items-center gap-2 mt-1 text-sm text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Low stock - you'll get alerts</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="unit">Unit Type</Label>
              <Select 
                value={formData.unit_type} 
                onValueChange={(value) => handleInputChange('unit_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="kg">per kg</SelectItem>
                  <SelectItem value="piece">per piece</SelectItem>
                  <SelectItem value="jar">per jar</SelectItem>
                  <SelectItem value="bundle">per bundle</SelectItem>
                  <SelectItem value="liter">per liter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your product (helps with auto-categorization)..."
              className="min-h-[100px]"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div>
            <Label>Product Images</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Click to upload images</p>
              <Button type="button" variant="outline">
                Choose Files
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || !formData.name || !formData.price || !formData.stock_quantity}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Adding Product...' : 'Save Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}