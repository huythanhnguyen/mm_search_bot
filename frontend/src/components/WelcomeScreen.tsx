import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputForm } from "@/components/InputForm";
import { Search, Package, Heart } from "lucide-react";

interface WelcomeScreenProps {
  handleSubmit: (query: string, imageFile: File | null, audioFile: File | null) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export function WelcomeScreen({
  handleSubmit,
  isLoading,
}: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto bg-background min-h-0">
      
      {/* Main Welcome Card */}
      <div className="w-full max-w-3xl space-y-4 sm:space-y-6 mt-4 sm:mt-0">
        
        {/* Header Card */}
        <Card className="text-center border-2 border-blue-500/30 shadow-lg bg-gradient-to-br from-blue-50/50 to-white">
          <CardHeader className="pb-4 px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 flex items-center justify-center gap-3 flex-wrap">
              <span className="text-center">MMVN Product Advisor</span>
            </CardTitle>
            <CardDescription className="text-base sm:text-lg text-blue-600/70 mt-2">
              Trợ lý thông minh cho mua sắm trực tuyến
            </CardDescription>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
              Tìm kiếm sản phẩm, nhận tư vấn, và quản lý giỏ hàng với AI Assistant của MM Vietnam. 
              Hỗ trợ tìm kiếm bằng văn bản, hình ảnh và giọng nói.
            </p>
          </CardHeader>
        </Card>

        {/* Input Form Card */}
        <Card className="border-2 border-blue-400/30 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Bắt đầu trò chuyện
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nhập câu hỏi của bạn hoặc mô tả sản phẩm cần tìm
                </p>
              </div>
              
              <InputForm 
                onSubmit={handleSubmit} 
                isLoading={isLoading} 
                context="homepage"
              />
              
              {/* Example queries */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3 text-center">
                  Ví dụ câu hỏi:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Chính sách giao hàng MM ra sao",
                    "Thịt heo tươi sống"
                  ].map((query, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => handleSubmit(query, null, null)}
                      disabled={isLoading}
                    >
                      "{query}"
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features badges */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 pb-4">
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-blue-400/50 text-blue-600">
            <Search className="w-3 h-3" />
            Tìm kiếm thông minh
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-blue-400/50 text-blue-600">
            <Package className="w-3 h-3" />
            Quản lý giỏ hàng
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs border-blue-400/50 text-blue-600">
            <Heart className="w-3 h-3" />
            Tư vấn cá nhân hóa
          </Badge>
        </div>
      </div>
    </div>
  );
} 