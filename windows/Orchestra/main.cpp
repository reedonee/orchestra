#include "App.h"
#include "ReactRootView.h"
#include <Windows.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.ApplicationModel.Core.h>
#include <winrt/Windows.UI.Core.h>

using namespace winrt;
using namespace Windows::ApplicationModel::Core;
using namespace Windows::UI::Core;

int __stdcall wWinMain(HINSTANCE instance, HINSTANCE prev, PWSTR cmd, int show)
{
    // Initialize XAML
    CoreApplication::Run([](auto&&) {
        CoreApplication::CreateNewView()->Dispatcher().RunAsync(
            CoreDispatcherPriority::Normal,
            [](auto&&) {
                auto rootView = make<App>();
                Window::Current().Content(rootView);
                Window::Current().Activate();
            });
    });

    return 0;
}
