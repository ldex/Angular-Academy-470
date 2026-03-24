import { Component, inject, output, input, computed, effect, signal } from '@angular/core';
import { Product } from '../../../../models/product.model';
import {
  form,
  required,
  minLength,
  FormField,
  pattern,
  min,
  max,
  schema,
  submit,
} from '@angular/forms/signals';

@Component({
  selector: 'app-product-form',
  imports: [FormField],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent {
  product = input<Product | null>()
  readonly isSubmitting = input(false);

  readonly save = output<Partial<Product>>();
  readonly cancel = output<void>();

  isEditing = computed(() => !!this.product());

  protected readonly productData = signal<Product>({
    id: 0,
    title: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    rating: { rate: 0, count: 0}
  });

  protected readonly productSchema = schema<Product>((path) => {
    required(path.title, { message: 'Title is required.'});
    minLength(path.title, 3, { message: 'Title must be at least 3 characters long.'});

    required(path.price, { message: 'Price is required.'});
    min(path.price, 0, { message: 'Price cannot be negative.'});
    max(path.price, 100000, { message: 'Price cannot exceed 100 000.'});

    required(path.description, { message: 'Description is required.'});
    minLength(path.description, 5, { message: 'Description must be at least 5 characters long.'});

    required(path.category, { message: 'Category is required.'});
    required(path.image, { message: 'Image is required.'});

    pattern(
      path.image,
      new RegExp(
        '^(https?://[a-zA-Z0-9-.]+.[a-zA-Z]{2,5}(?:/S*)?(?:[-A-Za-z0-9+&@#/%?=~_|!:,.;])+.)(\\?(?:&?[^=&]*=[^=&]*)*)?$'
      ),
      {
        message: 'Invalid image url.',
      }
    );
  });

  protected readonly productForm = form(this.productData, this.productSchema);
  protected readonly disableSubmit = computed(() =>  this.productForm().invalid() || this.productForm().submitting())

  protected submitForm(event: Event) {
    event.preventDefault(); // Prevent page reload (default browser behavior)

    submit(this.productForm, async (form) => {
      const newProduct = form().value();
      console.log('Product to save:', newProduct);
      await this.save.emit(newProduct);
    });
  }

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        this.productData.set(product)
      }
    });
  }

  onCancel(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.cancel.emit();
  }
}