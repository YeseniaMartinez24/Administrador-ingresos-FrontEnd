import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Directive({
  selector: '[dropZoneFormat]'
})
export class DndFormatDirective {
  @HostBinding('class.drop-format') fileOver: boolean = false;

  @Output() dropFormat: EventEmitter<File> = new EventEmitter<File>();

  private selectedFile: File | null = null;

  constructor(private toastr: ToastrService) { }
  @HostListener('dragover', ['$event']) onDragOver(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.fileOver = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.fileOver = false;
  }


  @HostListener('drop', ['$event']) onDrop(e: any): any {
    e.preventDefault();
    e.stopPropagation();
    this.fileOver = false;
    const files = e.dataTransfer.files;

    if(files.length != 1) return this.toastr.warning('The number of files is not valid')
    const file = files[0];
    if(!file.name.endsWith('xlsx')) return this.toastr.warning('Invalid file format')

    this.selectedFile = file as File;
    this.dropFormat.emit(this.selectedFile);
  }
}
