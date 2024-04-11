import { Component, OnInit } from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "@core/services/auth.service";
import {EmailCheckValidator, PassCheckValidator, PhoneNumberValidator} from "@core/utils/validators";
import {Router} from "@angular/router";
import {switchMap} from "rxjs";
import {RegisterAccountService} from "@shared/services/register-account.service";

@Component({
  selector: 'app-register-account',
  templateUrl: './register-account.component.html',
  styleUrls: ['./register-account.component.css']
})
export class RegisterAccountComponent implements OnInit {
  changPassState:boolean =true;
  type_password:'password'|'text' = "password";
  formSave: FormGroup;

  type_check_valid :1|2|3= 1;//1 chưa gửi //2:gửi thành công //3:gửi thất bai

  constructor(
    private fb :FormBuilder,
    private auth:AuthService,
    private registerAccountService:RegisterAccountService,
    private router:Router
  ) {
    this.formSave = this.fb.group({
      username: ['', Validators.required],
      email: ['',[Validators.required,EmailCheckValidator]],
      password: ['', [Validators.required, PassCheckValidator]],
      display_name: ['', Validators.required],
      phone:[null, [Validators.required,PhoneNumberValidator, Validators.maxLength(12), Validators.minLength(6)]],
    });
  }


  resetForm(){
    this.formSave.reset({
      username:'',
      email:'',
      password:'',
      display_name:'',
      phone:''
    })
  }

  ngOnInit(): void {
  }

  get f(): { [key: string]: AbstractControl<any> } {
    return this.formSave.controls;
  }

  btnShowPassWord(){
    this.type_password = this.type_password ==="password" ? "text": "password";
  }

  btnRegisterForm(){
    this.type_check_valid= 2;
    let username = this.f['username'].value?.trim();
    let display_name = this.f['display_name'].value?.trim();
    this.f['username'].setValue(username);
    this.f['display_name'].setValue(display_name);
    const dataParram : {} = {
      url: `${location.origin}${this.router.serializeUrl(this.router.createUrlTree(['verification/']))}`
    }

    this.registerAccountService.registerAccount(this.formSave.value).pipe(switchMap(prj =>{
      return this.registerAccountService.VerifiCationAccount(prj,dataParram)
    })).subscribe({
      next:(data)=>{
        this.type_check_valid= 3;
        this.resetForm();
      },error:(e)=>{
        console.log(e);
        this.type_check_valid= 1;
      }
    })
  }
}
