#include <node.h>
#include <windows.h>
#include <iostream>
#include <string>

using namespace v8;

void SetCursorPosition(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 2 || !args[0]->IsNumber() || !args[1]->IsNumber())
    {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong arguments").ToLocalChecked()));
        return;
    }

    int x = args[0]->Int32Value(isolate->GetCurrentContext()).FromJust();
    int y = args[1]->Int32Value(isolate->GetCurrentContext()).FromJust();

    POINT p;
    if (GetCursorPos(&p))
    {
        std::cout << x << ' ' << y;
        x += p.x;
        y += p.y;
        if (!SetCursorPos(x, y))
        {
            isolate->ThrowException(Exception::Error(
                String::NewFromUtf8(isolate, "Failed to set cursor position").ToLocalChecked()));
        }
    }
    else
    {
        isolate->ThrowException(Exception::Error(
            String::NewFromUtf8(isolate, "Failed to get cursor position").ToLocalChecked()));
    }
}

void Scroll(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 2 || !args[0]->IsNumber() || !args[1]->IsNumber())
    {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong arguments").ToLocalChecked()));
        return;
    }

    int xScrollAmount = args[0]->Int32Value(isolate->GetCurrentContext()).FromJust();
    int yScrollAmount = args[1]->Int32Value(isolate->GetCurrentContext()).FromJust();

    // Scroll vertical (y-axis)
    if (yScrollAmount != 0)
    {
        mouse_event(MOUSEEVENTF_WHEEL, 0, 0, yScrollAmount, 0);
    }

    // Scroll horizontal (x-axis)
    if (xScrollAmount != 0)
    {
        mouse_event(MOUSEEVENTF_HWHEEL, xScrollAmount, 0, 0, 0);
    }
}

// Zoom In/Out
void Zoom(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsNumber())
    {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong arguments").ToLocalChecked()));
        return;
    }

    int amount = args[0]->Int32Value(isolate->GetCurrentContext()).FromJust();
    keybd_event(VK_CONTROL, 0, 0, 0);
    mouse_event(MOUSEEVENTF_WHEEL, 0, 0, amount, 0);
    keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
}

// Minimize All Windows
void MinimizeAllWindows(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    HWND hWnd = GetDesktopWindow();
    ShowWindow(hWnd, SW_MINIMIZE);
}

// Restore All Windows
void RestoreAllWindows(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    HWND hWnd = GetDesktopWindow();
    ShowWindow(hWnd, SW_RESTORE);
}

void LeftClick(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
}

// Functie pentru simularea clicului dreapta
void RightClick(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
    mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
}

void SendKeyPress(const FunctionCallbackInfo<Value> &args)
{
    Isolate *isolate = args.GetIsolate();

    if (args.Length() < 1 || !args[0]->IsInt32())
    {
        isolate->ThrowException(Exception::TypeError(
            String::NewFromUtf8(isolate, "Wrong arguments").ToLocalChecked()));
        return;
    }

    int asciiCode = args[0]->Int32Value(isolate->GetCurrentContext()).FromJust();

    INPUT input = {0};

    // Setăm tipul inputului ca fiind tastatură
    input.type = INPUT_KEYBOARD;

    if (asciiCode != 8 && asciiCode != 13)
    {
        input.ki.wVk = 0;
        input.ki.wScan = asciiCode;
        input.ki.dwFlags = KEYEVENTF_UNICODE;
    }
    else if (asciiCode == 13)
    {
        input.ki.wScan = 0x1C;
        input.ki.dwFlags = KEYEVENTF_SCANCODE;
    }
    else if (asciiCode == 8)
    {
        input.ki.wScan = 0x0E;
        input.ki.dwFlags = KEYEVENTF_SCANCODE;
    }

    // Simulăm apăsarea tastei
    SendInput(1, &input, sizeof(INPUT));

    // Setăm steagul pentru eliberarea tastei
    input.ki.dwFlags |= KEYEVENTF_KEYUP;

    // Simulăm eliberarea tastei
    SendInput(1, &input, sizeof(INPUT));
}

void Initialize(Local<Object> exports)
{
    NODE_SET_METHOD(exports, "setCursorPosition", SetCursorPosition);
    NODE_SET_METHOD(exports, "scroll", Scroll);
    NODE_SET_METHOD(exports, "zoom", Zoom);
    NODE_SET_METHOD(exports, "minimizeAllWindows", MinimizeAllWindows);
    NODE_SET_METHOD(exports, "restoreAllWindows", RestoreAllWindows);
    NODE_SET_METHOD(exports, "leftClick", LeftClick);
    NODE_SET_METHOD(exports, "rightClick", RightClick);
    NODE_SET_METHOD(exports, "sendKeyPress", SendKeyPress);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)