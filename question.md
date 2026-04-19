**GDB调试中，希望将地址`0x12345678`开始的128字节内存、以16进制打印出来，以下哪条命令是正确的？（C）**（单选）

A. `x/128xw` 0x12345678
B. `x/32xg` 0x12345678
C. `x/32xw` 0x12345678
D. `x/128xg` 0x12345678

---

**下列语句声明的变量`a`中，可以用`std::cout << a`正确打印出`Hello`字符串的是（B）**（单选）
A. `char[2][5] = {"Hello", "World"};`
B. `char a[] = "Hello";`
C. `char a[][] = {'H', 'e', 'l', 'l', 'o'};`
D. `char a[5] = "Hello"`

---

**下列程序的输出结果是（C）**（单选）

```
#include <iostream>

class Base {
public:
    Base() { std::cout << "constructor of Base" << std::endl;}
    ~Base() { std::cout << "destructor of Base" << std::endl;}
  
    void* operator new (size_t size)
    {
        std::cout << "operator new" << std::endl;
        return ::operator new(size);
    }

    void* operator delete (void* pointer)
    {
        std::cout << "operator delete" << std::endl;
        return ::operator delete(pointer);
    }
};

int main ()
{
    Base *px = new Base;
    delete px;
    return 0;
}
```

A.

```
constructor of Base
operator new
operator delete
destructor of Base
```

B.

```
operator new
operator delete
```

C.

```
operator new
constructor of Base
destructor of Base
operator delete
```

D.

```
constructor of Base
destructor of Base
```

---
**以下哪些选项的代码单独填入横线处时，整段程序可以编译通过？**（BCD）（多选）

```
#include <iostream>
using namespace std;
struct Complex {
    int real;
    int imag;
};
void Function(_________) // 横线处需填入代码
{
    cout << "Complex" << endl;
    cout << c.real << "," << c.imag << endl;
}
int main()
{
    Function({1, 2});
    return 0;
}
```

A. `Complex& c`
B. `const Complex c`
C. `Complex c`
D. `const Complex& c`

---

```
class Data {
public:
    Data() = default;
    ...... // 其他成员函数，不包括构造函数
private:
    ___________  // 需输入代码

};
```

**以下哪些选项的代码单独填入到上面代码的横线处时，符合《华为C++语言编程规范》中关于类的成员变量初始化的原则、要求和建议？（AD）**（多选）
A. `std::string name{"}`
B. `std::uint32_t value`
C. `std::string name;`
D. `std::uint32_t value{1}`

---
