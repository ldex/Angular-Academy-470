import { Component, Input, inject, output, input, computed, effect } from '@angular/core';

import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-product-form',
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);

  product = input<Product | null>(null);

  isEditing = computed(() => !!this.product());

  // @Input() set product(value: Product | null) {
  //   if (value) {
  //     this.isEditing = true;
  //     this.productForm.patchValue({
  //       title: value.title,
  //       price: value.price,
  //       description: value.description,
  //       category: value.category,
  //       image: value.image
  //     });
  //   }
  // }
  readonly isSubmitting = input(false);

  readonly save = output<Partial<Product>>();
  readonly cancel = output<void>();

  productForm: FormGroup;

  constructor() {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      description: ['', Validators.required],
      category: ['', Validators.required],
      image: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });

    effect(() => {
      const product = this.product();
      if (product) {
        this.productForm.patchValue({
          title: product.title,
          price: product.price,
          description: product.description,
          category: product.category,
          image: product.image
        });
      }
    });

  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.save.emit(this.productForm.value);
    }
  }

  onCancel(): void {
    // TODO: The 'emit' function requires a mandatory void argument
    this.cancel.emit();
  }
}