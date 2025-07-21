import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslateButton } from './TranslateButton';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

export const ProductTranslation: React.FC = () => {
  const { getLocalizedContent } = useLanguage();
  const [sampleProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Fresh Organic Tomatoes',
      description: 'Locally grown organic tomatoes, perfect for salads and cooking. Rich in vitamins and antioxidants.',
      price: 12.99,
      category: 'vegetables'
    },
    {
      id: '2',
      name: 'Handwoven Basket',
      description: 'Beautiful handmade basket crafted by local artisans using traditional techniques. Perfect for storage or decoration.',
      price: 45.00,
      category: 'crafts'
    },
    {
      id: '3',
      name: 'Pure Honey',
      description: 'Raw, unprocessed honey harvested from local beehives. Natural sweetener with health benefits.',
      price: 18.50,
      category: 'food'
    }
  ]);

  const [localizedLabels, setLocalizedLabels] = useState({
    addToCart: 'Add to Cart',
    productSearch: 'Search products...'
  });

  useEffect(() => {
    const loadLocalizedLabels = async () => {
      try {
        const [addToCart, productSearch] = await Promise.all([
          getLocalizedContent('add_to_cart'),
          getLocalizedContent('product_search_placeholder')
        ]);

        setLocalizedLabels({
          addToCart,
          productSearch
        });
      } catch (error) {
        console.error('Error loading localized labels:', error);
      }
    };

    loadLocalizedLabels();
  }, [getLocalizedContent]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'vegetables': 'bg-green-100 text-green-800',
      'crafts': 'bg-purple-100 text-purple-800',
      'food': 'bg-orange-100 text-orange-800',
      'fruits': 'bg-red-100 text-red-800',
      'grains': 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Translation Demo</CardTitle>
          <p className="text-sm text-muted-foreground">
            See how product information is dynamically translated based on your language preference.
          </p>
        </CardHeader>
        <CardContent>
          {/* Search Box Example */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={localizedLabels.productSearch}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Product Category */}
                    <Badge className={getCategoryColor(product.category)}>
                      {product.category}
                    </Badge>

                    {/* Product Name */}
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <TranslateButton
                        text={product.name}
                        contentType="product"
                        contentId={product.id}
                        sourceLanguage="en"
                        size="sm"
                      />
                    </div>

                    {/* Product Description */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>
                      <TranslateButton
                        text={product.description}
                        contentType="product"
                        contentId={product.id}
                        sourceLanguage="en"
                        size="sm"
                      />
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-lg font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        {localizedLabels.addToCart}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Translation Note */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Product names and descriptions are automatically translated 
              using Google Translate API when you click the translate button. Translations are cached 
              for faster loading and cost efficiency. Static elements like "Add to Cart" use 
              pre-translated content from our localization database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};