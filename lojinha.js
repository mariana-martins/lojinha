Products = new Mongo.Collection("products");

if (Meteor.isClient) {

  // subscribers

  Meteor.subscribe("products");

  Accounts.config({
    forbidClientAccountCreation : true
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
  });

  GAnalytics.pageview("/");

  Template.products.helpers({
    products: function() {
      var category = Session.get("categoryFilter")
      var query = category ? { type: category } : {};
      return Products.find(query);
    },
    getProducTypeClass: function (type) {
      switch (type) {
        case "Eletrônicos & Eletrodomésticos":
          return "label-danger";
        case "Cozinha & Área de Serviço":
          return "label-warning";
        case "Outros":
          return "label-info";
        case "Móveis":
          return "label-success";
        case "Cama, Mesa & Banho":
          return "label-primary";
        default:
          return "";
      }
    },
    formatChecked: function(checked) {
      return checked ? "checked" : "";
    },
    formatBoolean: function(value) {
      return value ? "Sim" : "Não";
    },
    formatYesNo: function(value) {
      return _.trim(value) === "Sim" ? "Sim" : "Não";
    },
    encode: function(text) {
      return lodash.snakeCase(text);
    }
  });

  function cleanForm() {
    $("form.admin-form").trigger("reset");
    toastr.success("Produto adicionado com sucesso.", "Sucesso!");
  }

  Template.image_add_form.events({
    'submit .admin-form': function(event, template) {
      var form = {
        file: event.target.formFileImage.files[0],
        name: event.target.formTextName.value,
        description: event.target.formTextDescription.value,
        details: event.target.formTextDetails.value,
        price: event.target.formTextPrice.value,
        type: $(template.find('input:radio[name=formOptionType]:checked')).val(),
        dimensions: event.target.formTextDimensions.value,
        color: event.target.formTextColor.value,
        hasManual: event.target.formCheckHasManual.checked,
        boughtAt: event.target.formTextBoughtAt.value,
      };

      var fileReader = new FileReader();
      fileReader.onload = function(e) {
        var file = form.file;
        var name = form.name;
        var description = form.description;
        var details = form.details;
        var type = form.type;
        var price = form.price;
        var imageFile = file;
        var imageData = e.target.result;
        var productDimensions = form.dimensions;
        var productColor = form.color;
        var hasManual = form.hasManual;
        var boughtAt = form.boughtAt;

        Meteor.call("addProduct", name, description, details, type, price, imageFile,
        imageData, productDimensions, productColor, hasManual, boughtAt,
        function (error, result) {
          if (error) {
            toastr.error("Ocorreu um erro ao adicionar o produto.", "Erro :(");
          } else {
            cleanForm();
          }
        });

      };

      fileReader.readAsDataURL(form.file);

      return false;
    }

  });

  Template.products.events({
    'click .js-del-image': function(event) {
      GAnalytics.event('Remove produto', this.type, this.name);
      var image_id = this._id;
      $("#" + image_id).hide('slow', function () {
        Meteor.call("removeProduct", image_id, function(error, result) {
          if (error) {
            toastr.error("Ocorreu um erro ao remover o produto.", "Erro :(");
          } else {
            toastr.success("Produto removido com sucesso.", "Sucesso!");
          }

        });
      });
    },
    'click .js-modal':function(event){
      GAnalytics.event('Exibe produto', this.type, this.name);
      var modal_id = this._id;
      $('#' + modal_id).on('shown.bs.modal');
    },
    'click .products-all':function(event){
      GAnalytics.event('Filtra categoria', 'Sem filtro');
      Session.set("categoryFilter", null);
    },
    'click .products-filter':function(event){
      var type = event.currentTarget.value;
      GAnalytics.event('Filtra categoria', type);
      Session.set("categoryFilter", type);
    },
    'click .reserved input': function(event) {
      var product_id = this._id;
      var reserved = event.target.checked;
      GAnalytics.event('Reserva produto', product_id, reserved);
      Meteor.call("reserveProduct", product_id, reserved);
    }
  });
}

if (Meteor.isServer) {

  Meteor.startup(function () {
    console.log("Started!");
  });

  Meteor.publish("products", function () {
    var sortBy = { sort: {reserved: 1, name: 1}};
    return Products.find({}, sortBy);
  });

  Meteor.methods({
    addProduct: function (name, description, details, type, price, imageFile, imageData,
        productDimensions, productColor, hasManual, boughtAt) {
      return Products.insert({
        name: name,
        description: description,
        details: details,
        type: type,
        price: price,
        image: {
          name: imageFile.name,
          data: imageData,
          lastModified: imageFile.lastModified,
          lastModifiedDate: imageFile.lastModifiedDate,
          size: imageFile.size
        },
        productDimensions: productDimensions,
        productColor: productColor,
        hasManual: hasManual,
        boughtAt: boughtAt,
      });
    },

    removeProduct: function (image_id) {
      return Products.remove({_id: image_id});
    },

    reserveProduct: function (product_id, reserved) {
      return Products.update(product_id, {
        $set: { reserved: reserved }
      });
    }

  });
}
