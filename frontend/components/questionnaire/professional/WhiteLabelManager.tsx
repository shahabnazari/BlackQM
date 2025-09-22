'use client';

import React, { useState } from 'react';
import {
  Palette,
  Image,
  Download,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface BrandSettings {
  logo: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCSS: string;
  favicon: string;
  emailLogo: string;
  emailFooter: string;
  customDomain: string;
  removeWatermark: boolean;
}

export function WhiteLabelManager() {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    logo: '',
    companyName: 'Your Company',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
    customCSS: '',
    favicon: '',
    emailLogo: '',
    emailFooter: '',
    customDomain: '',
    removeWatermark: true,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
            <Palette className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">White-Label Customization</h2>
            <p className="text-sm text-gray-600">
              Customize the platform with your brand identity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Theme
          </Button>
          <Button>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="colors">Colors & Fonts</TabsTrigger>
          <TabsTrigger value="domain">Custom Domain</TabsTrigger>
          <TabsTrigger value="emails">Email Templates</TabsTrigger>
          <TabsTrigger value="advanced">Advanced CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Brand Assets</h3>
            <div className="space-y-4">
              <div>
                <Label>Company Logo</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center">
                  <Image className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <Button variant="outline">Upload Logo</Button>
                  <p className="text-xs text-gray-600 mt-2">
                    Recommended: 200x50px, PNG or SVG
                  </p>
                </div>
              </div>

              <div>
                <Label>Company Name</Label>
                <Input
                  value={brandSettings.companyName}
                  onChange={(e) => setBrandSettings({...brandSettings, companyName: e.target.value})}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Favicon</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-4">
                  <Button variant="outline" size="sm">Upload Favicon</Button>
                  <p className="text-xs text-gray-600 mt-2">32x32px, ICO or PNG</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={brandSettings.removeWatermark}
                  onCheckedChange={(v) => setBrandSettings({...brandSettings, removeWatermark: v})}
                />
                <Label>Remove platform watermark</Label>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Color Scheme</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={brandSettings.primaryColor}
                    onChange={(e) => setBrandSettings({...brandSettings, primaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={brandSettings.primaryColor}
                    onChange={(e) => setBrandSettings({...brandSettings, primaryColor: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Secondary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={brandSettings.secondaryColor}
                    onChange={(e) => setBrandSettings({...brandSettings, secondaryColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={brandSettings.secondaryColor}
                    onChange={(e) => setBrandSettings({...brandSettings, secondaryColor: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Accent Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={brandSettings.accentColor}
                    onChange={(e) => setBrandSettings({...brandSettings, accentColor: e.target.value})}
                    className="w-20 h-10"
                  />
                  <Input
                    value={brandSettings.accentColor}
                    onChange={(e) => setBrandSettings({...brandSettings, accentColor: e.target.value})}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Label>Font Family</Label>
              <select
                className="mt-2 w-full p-2 border rounded-lg"
                value={brandSettings.fontFamily}
                onChange={(e) => setBrandSettings({...brandSettings, fontFamily: e.target.value})}
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="custom">Custom Font...</option>
              </select>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Custom Domain Setup</h3>
            <div className="space-y-4">
              <div>
                <Label>Custom Domain</Label>
                <Input
                  placeholder="surveys.yourcompany.com"
                  value={brandSettings.customDomain}
                  onChange={(e) => setBrandSettings({...brandSettings, customDomain: e.target.value})}
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Point your DNS CNAME record to: app.vqmethod.com
                </p>
              </div>

              <Card className="p-4 bg-blue-50">
                <h4 className="font-medium mb-2">DNS Configuration</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div>Type: CNAME</div>
                  <div>Name: surveys</div>
                  <div>Value: app.vqmethod.com</div>
                  <div>TTL: 3600</div>
                </div>
              </Card>

              <div className="flex items-center gap-2">
                <Switch />
                <Label>Enable SSL certificate</Label>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Email Customization</h3>
            <div className="space-y-4">
              <div>
                <Label>Email Header Logo</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-4">
                  <Button variant="outline" size="sm">Upload Logo</Button>
                </div>
              </div>

              <div>
                <Label>Email Footer</Label>
                <Textarea
                  placeholder="© 2024 Your Company. All rights reserved."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label>Reply-To Email</Label>
                <Input
                  type="email"
                  placeholder="surveys@yourcompany.com"
                  className="mt-2"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Custom CSS</h3>
            <Textarea
              placeholder="/* Add your custom CSS here */
.survey-container {
  /* Your styles */
}"
              className="mt-2 font-mono text-sm"
              rows={15}
              value={brandSettings.customCSS}
              onChange={(e) => setBrandSettings({...brandSettings, customCSS: e.target.value})}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}